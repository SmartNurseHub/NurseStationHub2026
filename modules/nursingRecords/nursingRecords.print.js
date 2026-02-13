/* =================================================
   PRINT STICKER (SEPARATED FILE)
   ❗ ห้ามแก้ logic ภายในฟังก์ชันนี้
================================================= */

function printRecord(r) {
  console.log("🖨️ PRINT CLICKED", r);

  const tpl = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>Print Sticker</title>

<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap" rel="stylesheet">

<style>
@page { size: 90mm 60mm; margin: 3mm; }
body { margin:0; font-family:'Sarabun',Tahoma,sans-serif; }
.sticker { width:90mm; height:60mm; padding:2mm; box-sizing:border-box; }
.header { text-align:center; font-size:10px; }
.row { font-size:8px; margin-bottom:2px; }
hr { margin:2px 0; border-top:1px solid #000; }
table { width:100%; font-size:6px; border-collapse:collapse; }
td,th { border:1px solid #000; padding:2px; }
</style>
</head>

<body onload="window.print(); window.close();">
<div class="sticker">

<div class="header">
  <table width="100%" cellpadding="4">
    <tr>
      <td width="10%" align="left"><img src="/assets/images/LOGO.png" alt="LOGO" height="30"></td>

      <td width="60%" align="center">
        <b style="font-size:10px;">บันทึกการพยาบาลออนไลน์</b><br>
        <span style="font-size:8px;">มิตรไมตรีคลินิกเวชกรรม สาขาเขาน้อย</span>
      </td>

      <td width="30%" align="left">
        <b style="font-size:8px;">NSR:</b>
        <span style="font-weight:normal;font-size:8px;">${r.NSR || ""}</span>
        &nbsp;&nbsp;
        <b style="font-size:8px;">วันที่:</b>
        <span style="font-weight:normal;font-size:8px;">${toDisplayThaiDate(r.DateService) || ""}</span>
      </td>
    </tr>
  </table>
</div>

<hr>

<div style="font-size:8px;">
  <b>HN:</b> <span style="font-weight:normal;">${r.HN || ""}</span> &nbsp;&nbsp;
  <b>ชื่อ-นามสกุล:</b> <span style="font-weight:normal;">${r.PRENAME || ""}${r.NAME || ""} ${r.LNAME || ""}</span> &nbsp;&nbsp;
  <b>โทรศัพท์:</b> <span style="font-weight:normal;">${r.TELEPHONE || ""}</span>
</div>

<div style="font-size:8px;">
  <b>เลขบัตรประชาชน:</b> <span style="font-weight:normal;">${r.CID || ""}</span> &nbsp;&nbsp;
  <b>วันเกิด:</b> <span style="font-weight:normal;">${toDisplayThaiDate(toRawDate(r.BIRTH))} (${calculateAge(toRawDate(r.BIRTH))} ปี)</span>
</div>

<hr>

<div class="row"><b>กิจกรรม:</b><br>${r.Activity || ""}</div>
<div class="row"><b>วัตถุประสงค์:</b><br>${r.Objective || ""}</div>
<div class="row"><b>ข้อมูลสุขภาพ:</b><br>${r.HealthInform || ""}</div>
<div class="row"><b>คำแนะนำ:</b><br>${r.HealthAdvice || ""}</div>

<hr>
<div style="page-break-before: always;"></div>
<b style="font-size:8px;">บันทึกการติดตามผู้รับบริการ</b><br>

<table border="1" width="100%" cellspacing="0" cellpadding="4" style="font-size:7px;">
  <colgroup>
    <col width="6%">
    <col width="15%">
    <col width="12%">
    <col width="44%">
    <col width="23%">
  </colgroup>
  <thead>
    <tr>
      <th>ครั้ง</th>
      <th>วันที่ / เวลา</th>
      <th>ช่องทาง</th>
      <th>การประเมินผล</th>
      <th>ผู้ให้บริการ</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center" valign="top">1</td>
      <td align="center" valign="top">${r.Follow1Date || ""}<br>${r.Follow1Time || ""}</td>
      <td align="center" valign="top">${r.Follow1Route || ""}</td>
      <td align="left" valign="top">${r.Response1 || ""}</td>
      <td align="center"><br><br>${r.Provider1 || ""}</td>
    </tr>
    <tr>
      <td align="center" valign="top">2</td>
      <td align="center" valign="top">${r.Follow2Date || ""}<br>${r.Follow2Time || ""}</td>
      <td align="center" valign="top">${r.Follow2Route || ""}</td>
      <td align="left" valign="top">${r.Response2 || ""}</td>
      <td align="center"><br><br>${r.Provider2 || ""}</td>
    </tr>
    <tr>
      <td align="center" valign="top">3</td>
      <td align="center" valign="top">${r.Follow3Date || ""}<br>${r.Follow3Time || ""}</td>
      <td align="center" valign="top">${r.Follow3Route || ""}</td>
      <td align="left" valign="top">${r.Response3 || ""}</td>
      <td align="center"><br><br>${r.Provider3 || ""}</td>
    </tr>
  </tbody>
</table>

</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=400,height=600");
  w.document.write(tpl);
  w.document.close();
}

/* expose for onclick */
window.printRecord = printRecord;