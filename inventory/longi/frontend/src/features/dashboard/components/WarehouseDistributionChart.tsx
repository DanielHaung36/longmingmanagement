import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"

interface WarehouseData {
  name: string
  value: number
  qty: number
}

interface Props {
  warehouseData: WarehouseData[]
  totalValue: number
  totalStock: number
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]

export default function WarehouseDistributionChart({ warehouseData, totalValue, totalStock }: Props) {
  const { t } = useTranslation()


  const renderDetailView = () => (
    <div className="space-y-4">
      <div className="grid gap-4">
          {warehouseData.map((warehouse, idx) => {
            const percentage = ((warehouse.value / totalValue) * 100).toFixed(1)
            return (
              <div key={warehouse.name} className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                {/* 仓库标题行 */}
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md" 
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <h5 className="text-lg font-semibold text-gray-800">{warehouse.name}</h5>
                </div>
                
                {/* 数据统计行 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{t('dashboard.inventoryValue')}</div>
                    <div className="text-sm font-bold text-emerald-600 whitespace-nowrap overflow-hidden text-ellipsis" title={`$${warehouse.value.toLocaleString()}`}>
                      ${warehouse.value.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{t('dashboard.inventoryQuantity')}</div>
                    <div className="text-sm font-bold text-blue-600 whitespace-nowrap overflow-hidden text-ellipsis" title={`${warehouse.qty.toLocaleString()} pcs`}>
                      {warehouse.qty.toLocaleString()} pcs
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg min-w-0">
                    <div className="text-xs text-gray-500 mb-1">{t('dashboard.averagePrice')}</div>
                    <div className="text-sm font-bold text-purple-600 whitespace-nowrap overflow-hidden text-ellipsis" title={`$${warehouse.qty > 0 ? (warehouse.value / warehouse.qty).toFixed(2) : '0.00'}`}>
                      ${warehouse.qty > 0 ? (warehouse.value / warehouse.qty).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>

                {/* 进度条 */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('dashboard.valueRatio')}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: COLORS[idx % COLORS.length]
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30"></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
    </div>
  )

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <MapPin className="w-5 h-5 text-purple-500" />
          {t('dashboard.warehouseDetailStats')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {renderDetailView()}
      </CardContent>
    </Card>
  )
}