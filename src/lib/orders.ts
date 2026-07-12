// src/lib/orders.ts
import { prisma } from '@/lib/prisma';
import { generateBuyerToken, hashBuyerToken, encryptBuyerToken } from '@/lib/buyerToken';

// Confirma el pago, descuenta stock de forma segura (OVERSOLD si no alcanza) y,
// si quedó PAID, emite el código de comprador para comentarios (una sola vez por orden).
// `buyerCode` viaja en texto plano SOLO en el valor de retorno de esta función, dentro
// de la misma transacción/request — nunca se guarda en texto plano en la BD.
export async function settleOrderAsPaid(orderId: string, transactionId: string) {
    return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
        const items = await tx.orderItem.findMany({ where: { orderId } });

        let oversold = false;
        for (const item of items) {
        const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
        if (updated.count === 0) oversold = true;
        }

        await tx.order.update({
        where: { id: orderId },
        data: { status: oversold ? 'OVERSOLD' : 'PAID', transactionId },
        });

        let buyerCode: string | undefined;
        if (!oversold) {
        const existing = await tx.buyerCredential.findUnique({ where: { orderId } });
        if (!existing) {
            buyerCode = generateBuyerToken();
            await tx.buyerCredential.create({
            data: {
                orderId,
                tokenHash: hashBuyerToken(buyerCode),
                tokenEncrypted: encryptBuyerToken(buyerCode),
                customerName: order.customerName,
            },
            });
        }
        }

        return { status: (oversold ? 'OVERSOLD' : 'PAID') as 'OVERSOLD' | 'PAID', buyerCode };
    });
}