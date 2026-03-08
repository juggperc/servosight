'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function loginAction(formData: FormData) {
    const password = formData.get('password')

    if (password === '67ForJohnP0rk=') {
        (await cookies()).set('admin-auth', password, { secure: true, httpOnly: true, path: '/' })
        redirect('/admin')
    } else {
        return { error: 'Invalid credentials' }
    }
}
