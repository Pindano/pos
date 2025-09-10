import { type NextRequest, NextResponse } from "next/server"

// Mock database - in production, use Supabase
const orders: any[] = []

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()
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

    // Validate status transition
    const validStatuses = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid order status",
        },
        { status: 400 },
      )
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      status,
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      order: orders[orderIndex],
      message: `Order status updated to ${status}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update order status",
      },
      { status: 400 },
    )
  }
}
