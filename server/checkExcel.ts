import ExcelJS from 'exceljs';

async function checkExcel() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('C:/Longi/ProjectData/Excel/LJA Job Register Rev3.xlsx');
  const ws = wb.getWorksheet(1);

  console.log('表头:');
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const colLetter = String.fromCharCode(64 + colNumber);
    console.log(`列${colNumber} (${colLetter}): ${cell.value}`);
  });

  console.log('\n第2行数据样例:');
  const dataRow = ws.getRow(2);
  dataRow.eachCell((cell, colNumber) => {
    const colLetter = String.fromCharCode(64 + colNumber);
    console.log(`${colLetter}: ${cell.value}`);
  });
}

checkExcel();
