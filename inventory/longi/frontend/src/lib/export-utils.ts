export function exportToExcel(data: any[], filename: string) {
  // Create CSV content
  const headers = [
    "ID",
    "Product",
    "Status",
    "Description",
    "Attention To",
    "Email",
    "Mobile",
    "Company Name",
    "Project",
    "Quantity",
    "Created Date",
    "Unit Price",
    "Total Price",
  ]

  const csvContent = [
    headers.join(","),
    ...data.map((order) =>
      [
        order.id,
        `"${order.product}"`,
        order.status,
        `"${order.description}"`,
        `"${order.attentionTo}"`,
        order.email,
        order.mobile,
        `"${order.companyName}"`,
        `"${order.project}"`,
        order.quantity,
        order.createdDate,
        order.unitPrice,
        order.totalPrice,
      ].join(","),
    ),
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportProductCentricToExcel(data: any[], selectedProduct: string) {
  // Create CSV content for product-centric view
  const headers = [
    "Order ID",
    "Product Name",
    "Customer Company",
    "Attention To",
    "Project",
    "Quantity",
    "Order Date",
    "Unit Price",
    "Total Price",
    "Status",
  ]

  const csvContent = [
    headers.join(","),
    ...data.map((order) =>
      [
        order.id,
        `"${order.product}"`,
        `"${order.companyName}"`,
        `"${order.attentionTo}"`,
        `"${order.project}"`,
        order.quantity,
        order.createdDate,
        order.unitPrice,
        order.totalPrice,
        order.status,
      ].join(","),
    ),
    "", // Empty row
    "SUMMARY",
    `Total Orders,${data.length}`,
    `Total Value,$${data.reduce((sum, order) => sum + order.totalPrice, 0).toLocaleString()}`,
    `Selected Product,"${selectedProduct === "all" ? "All Products" : selectedProduct}"`,
  ].join("\n")

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  const filename =
    selectedProduct === "all"
      ? "product-analysis-all"
      : `product-analysis-${selectedProduct.replace(/[^a-zA-Z0-9]/g, "-")}`

  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function aggregateItemData(orders: any[], selectedItem: string) {
  const itemOrders = orders.filter((order) => order.product === selectedItem)

  let totalQuantity = 0
  let totalValue = 0
  const orderDetails = itemOrders.map((order) => {
    totalQuantity += order.quantity
    totalValue += order.totalPrice
    return {
      orderId: order.id,
      customer: order.companyName,
      project: order.project,
      orderDate: order.createdDate,
      itemDescription: order.description,
      partNo: "N/A", // Assuming partNo is not directly available
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      total: order.totalPrice,
      status: order.status,
    }
  })

  return {
    totalQuantity,
    totalValue,
    orderCount: itemOrders.length,
    orderDetails,
  }
}

export function exportItemAnalysis(orders: any[], selectedItem: string, dateRange: any, statusFilter: string) {
  const itemData = aggregateItemData(orders, selectedItem)

  const headers = [
    "Order ID",
    "Customer",
    "Project",
    "Order Date",
    "Item Description",
    "Part No",
    "Quantity",
    "Unit Price",
    "Total Value",
    "Status",
  ]

  const csvContent = [
    `Item Analysis Report: ${selectedItem}`,
    `Date Range: ${dateRange.start || "All"} to ${dateRange.end || "All"}`,
    `Status Filter: ${statusFilter === "all" ? "All Locations" : statusFilter}`,
    `Generated: ${new Date().toISOString().split("T")[0]}`,
    "",
    headers.join(","),
    ...itemData.orderDetails.map((detail) =>
      [
        detail.orderId,
        `"${detail.customer}"`,
        `"${detail.project}"`,
        detail.orderDate,
        `"${detail.itemDescription}"`,
        detail.partNo,
        detail.quantity,
        detail.unitPrice,
        detail.total,
        detail.status,
      ].join(","),
    ),
    "",
    "SUMMARY",
    `Total Quantity,${itemData.totalQuantity}`,
    `Total Value,$${itemData.totalValue.toLocaleString()}`,
    `Order Count,${itemData.orderCount}`,
    `Average Unit Price,$${Math.round(itemData.totalValue / itemData.totalQuantity).toLocaleString()}`,
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute(
    "download",
    `item-analysis-${selectedItem.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`,
  )
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportAggregatedData(aggregatedData: any, dateRange: any, statusFilter: string, selectedItem: string) {
  const csvContent = [
    "Sales Order Aggregated Report",
    `Date Range: ${dateRange.start || "All"} to ${dateRange.end || "All"}`,
    `Status Filter: ${statusFilter === "all" ? "All Locations" : statusFilter}`,
    `Item Filter: ${selectedItem === "all" || !selectedItem ? "All Items" : selectedItem}`,
    `Generated: ${new Date().toISOString().split("T")[0]}`,
    "",
    "SUMMARY METRICS",
    `Total Orders,${aggregatedData.totalOrders}`,
    `Total Value,$${aggregatedData.totalValue.toLocaleString()}`,
    `Average Order Value,$${Math.round(aggregatedData.totalValue / aggregatedData.totalOrders).toLocaleString()}`,
    "",
    ...(aggregatedData.itemAggregation
      ? [
          "ITEM ANALYSIS",
          `Selected Item,${selectedItem}`,
          `Item Quantity,${aggregatedData.itemAggregation.totalQuantity}`,
          `Item Value,$${aggregatedData.itemAggregation.totalValue.toLocaleString()}`,
          `Orders with Item,${aggregatedData.itemAggregation.orderCount}`,
          "",
        ]
      : []),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", `aggregated-report-${new Date().toISOString().split("T")[0]}.csv`)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportItemSearchResults(searchResults: any, searchTerm: string, dateRange: any) {
  const headers = [
    "Item Description",
    "Part No",
    "Unit",
    "Total Quantity",
    "Average Price",
    "Total Value",
    "Order Count",
  ]

  const itemSummaryContent = [
    `Item Search Results: "${searchTerm}"`,
    `Date Range: ${dateRange.start || "All"} to ${dateRange.end || "All"}`,
    `Generated: ${new Date().toISOString().split("T")[0]}`,
    "",
    "SUMMARY",
    `Items Found,${searchResults.matchingItems.length}`,
    `Total Quantity,${searchResults.totalQuantity}`,
    `Total Value,$${searchResults.totalValue.toLocaleString()}`,
    `Orders,${searchResults.orderCount}`,
    "",
    "ITEM DETAILS",
    headers.join(","),
    ...searchResults.matchingItems.map((item) =>
      [
        `"${item.description}"`,
        item.partNo,
        item.unit,
        item.totalQuantity,
        item.averagePrice.toFixed(2),
        item.totalValue,
        item.orderCount,
      ].join(","),
    ),
    "",
    "ORDER DETAILS",
    "Order ID,Order Date,Customer,Project,Item Description,Part No,Quantity,Unit Price,Total,Status",
    ...searchResults.orderDetails.map((detail) =>
      [
        detail.orderId,
        detail.orderDate,
        `"${detail.customer}"`,
        `"${detail.project}"`,
        `"${detail.itemDescription}"`,
        detail.partNo,
        detail.quantity,
        detail.unitPrice,
        detail.total,
        detail.status,
      ].join(","),
    ),
  ].join("\n")

  const blob = new Blob([itemSummaryContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute(
    "download",
    `item-search-${searchTerm.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().split("T")[0]}.csv`,
  )
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
