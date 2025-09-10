import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, use Supabase
const orders: any[] = []

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const order = orders.find((o) => o.id === params.id)

  if (!order) {
    return NextResponse.json(
      {
        success: false,
        message: "Order not found",
      },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, order })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const orderIndex = orders.findIndex((o) => o.id === params.id)

    if (orderIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found",
        },
        { status: 404 },
      )
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      order: orders[orderIndex],
      message: "Order updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order",
      },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const orderIndex = orders.findIndex((o) => o.id === params.id)

  if (orderIndex === -1) {
    return NextResponse.json(
      {
        success: false,
        message: "Order not found",
      },
      { status: 404 },
    )
  }

  orders.splice(orderIndex, 1)

  return NextResponse.json({
    success: true,
    message: "Order deleted successfully",
  })
}
