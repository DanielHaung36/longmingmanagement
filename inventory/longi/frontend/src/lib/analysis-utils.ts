export function filterOrdersByDateRange(orders: any[], startDate: string, endDate: string) {
  return orders.filter((order) => {
    const orderDate = new Date(order.createdDate)
    const start = startDate ? new Date(startDate) : new Date("1900-01-01")
    const end = endDate ? new Date(endDate) : new Date("2100-12-31")

    return orderDate >= start && orderDate <= end
  })
}

export function getItemsFromOrders(orders: any[]) {
  const items = new Set<string>()

  orders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item: any) => {
        items.add(item.description)
        if (item.partNo) {
          items.add(item.partNo)
        }
      })
    }
  })

  return Array.from(items).sort()
}

export function aggregateItemData(orders: any[], itemSearch: string) {
  let totalQuantity = 0
  let totalValue = 0
  let orderCount = 0
  const orderDetails: any[] = []

  orders.forEach((order) => {
    if (order.items) {
      const matchingItems = order.items.filter(
        (item: any) =>
          item.description.toLowerCase().includes(itemSearch.toLowerCase()) ||
          item.partNo.toLowerCase().includes(itemSearch.toLowerCase()),
      )

      if (matchingItems.length > 0) {
        orderCount++
        matchingItems.forEach((item: any) => {
          totalQuantity += item.qty
          totalValue += item.total

          orderDetails.push({
            orderId: order.id,
            customer: order.companyName,
            project: order.project,
            orderDate: order.createdDate,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            total: item.total,
            status: order.status,
            itemDescription: item.description,
            partNo: item.partNo,
          })
        })
      }
    }
  })

  return {
    totalQuantity,
    totalValue,
    orderCount,
    orderDetails,
  }
}

export function searchItemsInOrders(orders: any[], searchTerm: string, dateRange: { start: string; end: string }) {
  if (!searchTerm) return null

  const matchingItems = new Map<
    string,
    {
      description: string
      partNo: string
      unit: string
      totalQuantity: number
      totalValue: number
      orderCount: number
      averagePrice: number
      priceHistory: { date: string; price: number; orderId: string }[]
    }
  >()

  const orderDetails: any[] = []
  let totalQuantity = 0
  let totalValue = 0
  let orderCount = 0

  orders.forEach((order) => {
    if (order.items) {
      const matchingOrderItems = order.items.filter(
        (item: any) =>
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.partNo.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      if (matchingOrderItems.length > 0) {
        orderCount++

        matchingOrderItems.forEach((item: any) => {
          const key = `${item.description}-${item.partNo}`

          if (!matchingItems.has(key)) {
            matchingItems.set(key, {
              description: item.description,
              partNo: item.partNo,
              unit: item.unit,
              totalQuantity: 0,
              totalValue: 0,
              orderCount: 0,
              averagePrice: 0,
              priceHistory: [],
            })
          }

          const itemData = matchingItems.get(key)!
          itemData.totalQuantity += item.qty
          itemData.totalValue += item.total
          itemData.orderCount += 1
          itemData.averagePrice = itemData.totalValue / itemData.totalQuantity
          itemData.priceHistory.push({
            date: order.createdDate,
            price: item.unitPrice,
            orderId: order.id,
          })

          totalQuantity += item.qty
          totalValue += item.total

          orderDetails.push({
            orderId: order.id,
            orderDate: order.createdDate,
            customer: order.companyName,
            project: order.project,
            itemDescription: item.description,
            partNo: item.partNo,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            total: item.total,
            status: order.status,
          })
        })
      }
    }
  })

  // Sort price history by date for each item
  matchingItems.forEach((item) => {
    item.priceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  return {
    matchingItems: Array.from(matchingItems.values()),
    orderDetails: orderDetails.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()),
    totalQuantity,
    totalValue,
    orderCount: new Set(orderDetails.map((d) => d.orderId)).size, // Unique orders
  }
}

export function calculateOrderTotals(items: any[]) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const fobCost = subtotal * 0.05 // 5% FOB cost
  const ddpCost = subtotal * 0.08 // 8% DDP cost
  const grandTotal = subtotal + fobCost + ddpCost

  return {
    subtotal,
    fobCost,
    ddpCost,
    grandTotal,
  }
}
