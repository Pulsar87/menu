'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface MenuItem {
  id: string
  name: string
  description: string | null
  priceCents: number
  imageUrl: string | null
  isAvailable: boolean
  isFeatured: boolean
  allergens: string[]
  prepTimeMin: number
}

interface Category {
  id: string
  name: string
  sortOrder: number
  menuItems: MenuItem[]
}

interface MenuData {
  restaurant: {
    id: string
    name: string
    slug: string
    currency: string
  }
  categories: Category[]
}

export default function TableMenuPage() {
  const params = useParams()
  const slug = params?.slug as string
  const token = params?.token as string
  
  const [menu, setMenu] = useState<MenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number }>>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`/api/v1/restaurants/${slug}/menu`)
        const data = await res.json()
        if (data.menu) {
          setMenu(data.menu)
          if (data.menu.categories.length > 0) {
            setSelectedCategory(data.menu.categories[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchMenu()
    }
  }, [slug])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id)
      if (existing) {
        return prev.map(c => 
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.item.priceCents * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading menu...</div>
      </div>
    )
  }

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">Failed to load menu</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">{menu.restaurant.name}</h1>
          <p className="text-sm text-gray-500">Table Token: {token.substring(0, 8)}...</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {menu.categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {menu.categories
          .filter(c => !selectedCategory || c.id === selectedCategory)
          .map(category => (
            <section key={category.id} className="mb-8">
              <h2 className="text-lg font-semibold mb-4">{category.name}</h2>
              <div className="space-y-4">
                {category.menuItems.map(item => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        {item.isFeatured && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Featured</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      )}
                      {item.allergens.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {item.allergens.map(allergen => (
                            <span key={allergen} className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <span className="font-semibold">
                          {(item.priceCents / 100).toFixed(2)} {menu.restaurant.currency}
                        </span>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!item.isAvailable}
                          className={`px-4 py-2 rounded-md text-sm font-medium ${
                            item.isAvailable
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {item.isAvailable ? 'Add' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </main>

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{cartCount} items</span>
              <span className="ml-4 text-lg font-bold">
                {(cartTotal / 100).toFixed(2)} {menu.restaurant.currency}
              </span>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700">
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
