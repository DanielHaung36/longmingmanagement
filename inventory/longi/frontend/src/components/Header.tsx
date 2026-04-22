import { Typography, Box, useTheme, useMediaQuery } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // 判断屏幕宽度
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));  // 手机
  const isMedium = useMediaQuery(theme.breakpoints.between("sm", "md")); // 平板
  const isLarge = useMediaQuery(theme.breakpoints.up("md")); // 桌面

  // 动态设置字号、间距等
  const getTitleVariant = () => {
    if (isSmall) return "h5";
    if (isMedium) return "h4";
    return "h4";
  };

  const getSubtitleVariant = () => {
    if (isSmall) return "body1";
    if (isMedium) return "h6";
    return "h6";
  };

  const getBoxMb = () => (isSmall ? "10px" : isMedium ? "15px" : "20px");

  return (
    <Box mb={getBoxMb()} textAlign="left" sx={{display:'flex',flexDirection:'column',backgroundColor:"#ffff"}}>
      <Typography
        variant={getTitleVariant()}
        color={colors.grey[100]}
        fontWeight="bold"
        sx={{ m: "0 0 5px 0" }}
      >
        {title}
      </Typography>
      <Typography
        variant={getSubtitleVariant()}
        color={colors.greenAccent[400]}
        sx={{ fontWeight: isSmall ? 400 : 500 }}
      >
        {subtitle}
      </Typography>
    </Box>
  );
};

export default Header;
