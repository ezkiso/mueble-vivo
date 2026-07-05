import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

export default async function DashboardPage() {
  const [totalProductos, ordenesRecientes, ventasTotales] = await Promise.all([
    prisma.product.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-titulo text-2xl text-tierra-oscuro">Panel de administración</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/productos" className="underline">Productos</Link>
          <Link href="/admin/ordenes" className="underline">Órdenes</Link>
        </nav>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white border border-tierra-claro rounded-xl p-5">
          <p className="text-sm text-gray-500">Productos totales</p>
          <p className="text-2xl font-semibold">{totalProductos}</p>
        </div>
        <div className="bg-white border border-tierra-claro rounded-xl p-5">
          <p className="text-sm text-gray-500">Ventas totales (pagadas)</p>
          <p className="text-2xl font-semibold">{clp.format(ventasTotales._sum.totalAmount || 0)}</p>
        </div>
        <div className="bg-white border border-tierra-claro rounded-xl p-5">
          <p className="text-sm text-gray-500">Órdenes recientes</p>
          <p className="text-2xl font-semibold">{ordenesRecientes.length}</p>
        </div>
      </div>

      <h2 className="font-titulo text-lg mb-3">Últimas órdenes</h2>
      <div className="bg-white border border-tierra-claro rounded-xl divide-y">
        {ordenesRecientes.map((o) => (
          <div key={o.id} className="p-3 flex justify-between text-sm">
            <span>{o.buyOrder}</span>
            <span>{o.customerName}</span>
            <span>{clp.format(o.totalAmount)}</span>
            <span>{o.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
