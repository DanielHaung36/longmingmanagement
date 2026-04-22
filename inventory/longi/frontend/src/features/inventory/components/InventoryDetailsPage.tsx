import React from "react";
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { InventoryRow } from "./InventoryModel";
import { useTranslation } from "react-i18next";
import {memo} from "react"
import type { FC, ReactNode } from "react"
import {WarehouseLabel} from "../../barcodegenerator/LabelPrinter";

export interface IProps {
    children?:ReactNode;
    //...这里定义相关类型
    //扩展相关属性
}

const InventoryDetailsPage:FC<IProps> = memo(function ({ children }) {
    return (
        <div className="inventoryDetailsPage">
            <div>InventoryDetailsPage</div>
                 <WarehouseLabel
                    widthMm={50}
                    heightMm={30}
                    dpi={200}
                    brand="LONGi"
                    brandEn="Magnet"
                    title="盘式变压器油泵盘式变压器油泵"
                    entitle="Disc type transformer oil pump Disc type transformer oil pump"
                    infoTable={[
                        ["型号: LG10035", "Model: LG10035"],
                        ["供应商: LONGi", "Supplier: LONGi"],
                        ["时间: 2025/05/24", "Inbound Time: 2025/05/24"]
                    ]}
                    barcodeValue="057487795808"
                    qrcodeValue="057487795808"
                    />
        </div>
    )
})

export default InventoryDetailsPage
InventoryDetailsPage.displayName = "InventoryDetailsPage" //方便以后调试使用

interface DetailDrawerProps {
  open: boolean;
  row: InventoryRow | null;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ open, row, onClose }) => {
  const { t } = useTranslation();

  if (!row) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">{t("dialog.detail")}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <List>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.partNumberCN")}
              secondary={row.partNumberCN}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.partNumberAU")}
              secondary={row.partNumberAU}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.barcode")}
              secondary={row.barcode}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.description")}
              secondary={row.description}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.descriptionChinese")}
              secondary={row.descriptionChinese}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.warehouse")}
              secondary={row.warehouse}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.siteLocation")}
              secondary={row.siteLocation}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.asset")}
              secondary={row.asset}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.customer")}
              secondary={row.customer}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.note")}
              secondary={row.note}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.partGroup")}
              secondary={row.partGroup}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.partLife")}
              secondary={row.partLife}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.oem")}
              secondary={row.oem}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.purchasePrice")}
              secondary={`¥${row.purchasePrice}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.unitPrice")}
              secondary={`¥${row.unitPrice}`}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.actualQty")}
              secondary={row.actualQty}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.lockedQty")}
              secondary={row.lockedQty}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.availableQty")}
              secondary={row.availableQty}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.operator")}
              secondary={row.operator}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={t("inventoryColumns.operationTime")}
              secondary={row.operationTime}
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};