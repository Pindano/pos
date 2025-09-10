import { type NextRequest, NextResponse } from "next/server"

// Mock database operations - in production, these would use Supabase
const orders: any[] = []

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const customerId = searchParams.get("customer_id")

  let filteredOrders = orders

  if (status && status !== "all") {
    filteredOrders = filteredOrders.filter((order) => order.status === status)
  }

  if (customerId) {
    filteredOrders = filteredOrders.filter((order) => order.customer_id === customerId)
  }

  return NextResponse.json({
    orders: filteredOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
  })
}

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    const newOrder = {
      id: `order-${Date.now()}`,
      ...orderData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    orders.push(newOrder)

    return NextResponse.json(
      {
        success: true,
        order: newOrder,
        message: "Order created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create order",
      },
      { status: 400 },
    )
  }
}
