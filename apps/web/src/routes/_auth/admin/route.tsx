import {Outlet, createFileRoute, redirect} from '@tanstack/react-router'
import {authClient} from '@/lib/auth-client'

export const Route = createFileRoute('/_auth/admin')({
	component: AdminLayout,
	beforeLoad: async () => {
		const session = await authClient.getSession();

		if (session.data?.user.role !== 'admin') {
			throw redirect({
				to: "/dashboard",
				replace: true
			})
		}
		return { session }
	}
})

function AdminLayout() {
	return <Outlet/>
}
