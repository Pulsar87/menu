import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a sample restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'sample-restaurant' },
    update: {},
    create: {
      name: 'Sample Restaurant',
      slug: 'sample-restaurant',
      timezone: 'UTC',
      currency: 'USD',
      address: '123 Main St, City, Country',
      phone: '+1234567890',
      settings: {
        taxRate: 0.1,
        tipDefaults: [10, 15, 20],
      },
    },
  })

  console.log('Created restaurant:', restaurant.name)

  // Create categories
  const appetizers = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Appetizers',
      sortOrder: 1,
    },
  })

  const mains = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Main Courses',
      sortOrder: 2,
    },
  })

  const desserts = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Desserts',
      sortOrder: 3,
    },
  })

  console.log('Created categories')

  // Create menu items
  await prisma.menuItem.createMany({
    data: [
      {
        categoryId: appetizers.id,
        restaurantId: restaurant.id,
        name: 'Bruschetta',
        description: 'Toasted bread with tomatoes, garlic, and basil',
        priceCents: 899,
        isAvailable: true,
        isFeatured: true,
        allergens: ['gluten'],
        prepTimeMin: 10,
        sortOrder: 1,
      },
      {
        categoryId: appetizers.id,
        restaurantId: restaurant.id,
        name: 'Calamari',
        description: 'Crispy fried squid rings with marinara sauce',
        priceCents: 1299,
        isAvailable: true,
        allergens: ['seafood', 'gluten'],
        prepTimeMin: 15,
        sortOrder: 2,
      },
      {
        categoryId: mains.id,
        restaurantId: restaurant.id,
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with seasonal vegetables',
        priceCents: 2499,
        isAvailable: true,
        isFeatured: true,
        allergens: ['fish'],
        prepTimeMin: 25,
        sortOrder: 1,
      },
      {
        categoryId: mains.id,
        restaurantId: restaurant.id,
        name: 'Ribeye Steak',
        description: '12oz ribeye with mashed potatoes and gravy',
        priceCents: 3299,
        isAvailable: true,
        allergens: [],
        prepTimeMin: 30,
        sortOrder: 2,
      },
      {
        categoryId: mains.id,
        restaurantId: restaurant.id,
        name: 'Vegetarian Pasta',
        description: 'Penne with seasonal vegetables in tomato sauce',
        priceCents: 1899,
        isAvailable: true,
        allergens: ['gluten'],
        prepTimeMin: 20,
        sortOrder: 3,
      },
      {
        categoryId: desserts.id,
        restaurantId: restaurant.id,
        name: 'Tiramisu',
        description: 'Classic Italian dessert with coffee-soaked ladyfingers',
        priceCents: 799,
        isAvailable: true,
        isFeatured: true,
        allergens: ['dairy', 'eggs', 'gluten'],
        prepTimeMin: 5,
        sortOrder: 1,
      },
      {
        categoryId: desserts.id,
        restaurantId: restaurant.id,
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center',
        priceCents: 899,
        isAvailable: true,
        allergens: ['dairy', 'eggs', 'gluten'],
        prepTimeMin: 15,
        sortOrder: 2,
      },
    ],
  })

  console.log('Created menu items')

  // Create tables with QR tokens
  const crypto = require('crypto')
  
  for (let i = 1; i <= 10; i++) {
    const qrToken = crypto.randomBytes(32).toString('hex')
    await prisma.table.create({
      data: {
        restaurantId: restaurant.id,
        number: `${i}`,
        seats: i % 2 === 0 ? 4 : 2,
        zone: i <= 5 ? 'Indoor' : 'Outdoor',
        qrToken,
      },
    })
  }

  console.log('Created 10 tables with QR tokens')

  // Create a sample user (owner)
  await prisma.user.upsert({
    where: { email: 'owner@sample-restaurant.com' },
    update: {},
    create: {
      email: 'owner@sample-restaurant.com',
      name: 'Restaurant Owner',
      role: 'OWNER',
      restaurantId: restaurant.id,
    },
  })

  console.log('Created owner user')

  console.log('\n✅ Seed completed successfully!')
  console.log(`Restaurant slug: ${restaurant.slug}`)
  console.log('Owner email: owner@sample-restaurant.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
