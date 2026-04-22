import React from "react"
import {
  Box,
  Pagination as MuiPagination,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Stack,
} from "@mui/material"
import { SelectChangeEvent } from "@mui/material/Select"

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function PaginationMUI({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    const newSize = event.target.value as number
    onPageSizeChange(newSize)
    // Reset to page 1 when changing page size
    if (currentPage > Math.ceil(totalItems / newSize)) {
      onPageChange(1)
    }
  }

  if (totalItems === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          py: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No items to display
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        py: 1,
        px: 2,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        boxShadow: "0 -2px 6px rgba(0,0,0,0.05)",
         borderRadius: 2, // Rounded corners
      }}
    >
      {/* Items info and page size selector */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ order: { xs: 2, sm: 1 } }}
      >
        <Typography  sx={{
          display: { xs: "none", sm: "block" }, // xs 下隐藏，sm 及以上显示
        }}
   variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {totalItems} items
        </Typography>

        <Stack direction="row"  spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Show
          </Typography>
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={handlePageSizeChange}
              sx={{
                minWidth: 70,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "& .MuiSelect-select": {
                  py: 0.5,
                  fontSize: "0.875rem",
                },
              }}
            >
              {pageSizeOptions.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            per page
          </Typography>
        </Stack>
      </Stack>

      {/* Pagination controls */}
      <Box sx={{ order: { xs: 1, sm: 2 } }}>
        <MuiPagination
          count={totalPages}
          page={currentPage}
          onChange={(_, page) => onPageChange(page)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          size="small"       // 小号按钮更省空间
          sx={{
            "& .MuiPaginationItem-root": {
              borderRadius: 1,
              fontWeight: 500,
              "&.Mui-selected": {
                backgroundColor: "grey.900",
                color: "white",
                "&:hover": {
                  backgroundColor: "grey.800",
                },
              },
            },
          }}
        />
      </Box>
    </Box>
  )
}
