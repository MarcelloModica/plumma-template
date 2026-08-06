import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ItemService } from '@/lib/ItemService'
import { AuthService } from '@/lib/AuthService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const userName = AuthService.getSecurityInfoFromStorage()?.userInfo?.userName ?? ''

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')

  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: ItemService.list,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      ItemService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        quantity: Number(quantity) || 0,
      }),
    onSuccess: () => {
      setName('')
      setDescription('')
      setQuantity('1')
      void queryClient.invalidateQueries({ queryKey: ['items'] })
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ItemService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
    onError: () => toast.error(t('common.error')),
  })

  const items = itemsQuery.data ?? []

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <h1 className="text-2xl font-semibold">{t('dashboard.title')}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t('dashboard.welcome', { name: userName })} — {t('dashboard.description')}
      </p>

      <form
        className="mt-6 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) return
          createMutation.mutate()
        }}
      >
        <Input
          className="w-48"
          placeholder={t('dashboard.namePlaceholder')}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          className="w-64"
          placeholder={t('dashboard.descPlaceholder')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Input
          className="w-24"
          type="number"
          min={0}
          placeholder={t('dashboard.qtyPlaceholder')}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
          {t('dashboard.add')}
        </Button>
      </form>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.colName')}</TableHead>
              <TableHead>{t('dashboard.colDescription')}</TableHead>
              <TableHead className="w-24 text-right">{t('dashboard.colQuantity')}</TableHead>
              <TableHead className="w-20 text-right">{t('dashboard.colActions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-destructive">
                  {t('dashboard.loadError')}
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  {itemsQuery.isLoading ? t('common.loading') : t('dashboard.empty')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('common.delete')}
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
