import { redirect } from 'next/navigation'

export default function PerfilRedirect({ params }: { params: { slug: string } }) {
  redirect('/' + params.slug)
}
