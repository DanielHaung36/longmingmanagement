import { Box, useTheme } from "@mui/material";
import Header from "../../components/Header";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

const FAQ = () => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box m="1rem" sx={{display:'flex',flexDirection:'column',overflow:'auto',backgroundColor:"#fff"}}>
      <Header title={t('faq.title')} subtitle={t('faq.subtitle')} />
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="primary" variant="h5">
            {t("faq.newProductTitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t("faq.newProductContent")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="primary" variant="h5">
            {t("faq.outboundTitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t("faq.outboundContent")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="primary" variant="h5">
            {t("faq.transferTitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t("faq.transferContent")}
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography color="primary" variant="h5">
            {t("faq.transactionTitle")}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {t("faq.transactionContent")}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default FAQ;
