/* رتّب مكتبك · Desk Planner — main application (Three.js r128). */
(function(){
"use strict";

/* ================= helpers ================= */
var CM = 1/2.54;
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function fmt(n){ return (Math.round(n*10)/10).toString(); }
function toCm(n){ return Math.round(n*2.54); }
function hexToRgb(h){ var n=parseInt(h.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbHex(r,g,b){ return "#"+[r,g,b].map(function(v){ return ("0"+clamp(Math.round(v),0,255).toString(16)).slice(-2); }).join(""); }
function mix(h,t,k){ var a=hexToRgb(h), b=hexToRgb(t); return rgbHex(a[0]+(b[0]-a[0])*k, a[1]+(b[1]-a[1])*k, a[2]+(b[2]-a[2])*k); }
function lum(h){ var c=hexToRgb(h); return (0.299*c[0]+0.587*c[1]+0.114*c[2])/255; }
function el(tag, cls, text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
function isNum(v){ return typeof v==="number" && isFinite(v); }
function clone(o){ return JSON.parse(JSON.stringify(o)); }

/* ================= settings & i18n ================= */
var SETTINGS_KEY="desk-planner-3d.settings.v1";
var settings={ theme:document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light", lang:"ar" };
try{ var ss=JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}"); if(ss.lang==="en") settings.lang="en"; }catch(e){}
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){} }

var STR = {
  appTitle:{ ar:"رتّب مكتبك", en:"Desk Planner" },
  appSub:{ ar:"خطّط مكتبك قبل ما تشتري", en:"Plan your desk before you buy" },
  tabAdd:{ ar:"إضافة", en:"Add" }, tabItems:{ ar:"العناصر", en:"Items" }, tabDesk:{ ar:"الطاولة", en:"Desk" },
  whatAdd:{ ar:"شو بدك تضيف؟", en:"What do you want to add?" },
  placeDesk:{ ar:"حطّه عالطاولة", en:"Place on desk" }, placeFloor:{ ar:"حطّه عالأرض", en:"Place on floor" }, placeChair:{ ar:"حطّ الكرسي قدّام الطاولة", en:"Place chair at the desk" },
  viewAngle:{ ar:"مائل", en:"Angled" }, viewFront:{ ar:"من قدّام", en:"Front" }, viewTop:{ ar:"من فوق", en:"Top" }, viewSide:{ ar:"من الجنب", en:"Side" },
  hint:{ ar:"اسحب أي عنصر لتحرّكه · اسحب الفراغ لتدوّر · زر يمين للتحريك<br><kbd>{m}+Z</kbd> تراجع · <kbd>{m}+C</kbd> <kbd>{m}+V</kbd> نسخ ولصق · <kbd>?</kbd> كل الاختصارات",
         en:"Drag any item to move it · drag empty space to orbit · right-drag to pan<br><kbd>{m}+Z</kbd> undo · <kbd>{m}+C</kbd> <kbd>{m}+V</kbd> copy &amp; paste · <kbd>?</kbd> all shortcuts" },
  extras:{ ar:"إضافات", en:"Extras" }, extrasTitle:{ ar:"إكسسوارات إضافية", en:"Extra accessories" }, extrasSub:{ ar:"ستاندات ومايكات", en:"Stands & mics" },
  edit:{ ar:"تعديل", en:"Edit" }, done:{ ar:"تم", en:"Done" }, dup:{ ar:"نسخة تانية", en:"Duplicate" }, del:{ ar:"حذف", en:"Delete" },
  rotL:{ ar:"تدوير عكس عقارب الساعة", en:"Rotate left" }, rotR:{ ar:"تدوير مع عقارب الساعة", en:"Rotate right" }, deselect:{ ar:"إلغاء التحديد", en:"Deselect" },
  menu:{ ar:"القائمة", en:"Menu" },
  arrange:{ ar:"رتّب تلقائيًا", en:"Auto-arrange" }, clearAll:{ ar:"امسح الكل", en:"Clear all" }, sure:{ ar:"متأكد؟ اضغط مرة تانية", en:"Sure? Click again" },
  emptyDesk:{ ar:"الطاولة فاضية. اختار شي من تبويب الإضافة وحطّه عليها.", en:"The desk is empty. Pick something in the Add tab to place it." },
  deskShape:{ ar:"شكل الطاولة", en:"Desk shape" }, rect:{ ar:"مستطيلة", en:"Rectangle" }, lRight:{ ar:"حرف L يمين", en:"L, right" }, lLeft:{ ar:"حرف L يسار", en:"L, left" },
  dims:{ ar:"الأبعاد بالسنتيمتر", en:"Dimensions (cm)" }, width:{ ar:"العرض", en:"Width" }, depth:{ ar:"العمق", en:"Depth" }, height:{ ar:"الارتفاع", en:"Height" },
  retLen:{ ar:"طول الجناح", en:"Return length" }, retDepth:{ ar:"عرض الجناح", en:"Return width" },
  deskColor:{ ar:"لون الطاولة", en:"Desk color" }, common:{ ar:"مقاسات شائعة", en:"Common sizes" }, fitTitle:{ ar:"هل كل شي بيوسع؟", en:"Does everything fit?" },
  deskRange:{ ar:"العرض 60–400، العمق 40–150، الارتفاع 40–130 سم. الجناح أطول من العمق بـ 20 سم على الأقل.", en:"Width 60–400, depth 40–150, height 40–130 cm. The return must be at least 20 cm longer than the depth." },
  size:{ ar:"القياس القطري (إنش)", en:"Diagonal (in)" }, ratio:{ ar:"نسبة الأبعاد", en:"Aspect ratio" }, custom:{ ar:"مخصّصة…", en:"Custom…" },
  rW:{ ar:"عرض", en:"Width" }, rH:{ ar:"ارتفاع", en:"Height" }, name:{ ar:"الاسم (اختياري)", en:"Name (optional)" },
  orient:{ ar:"الاتجاه", en:"Orientation" }, landscape:{ ar:"أفقية", en:"Landscape" }, portrait:{ ar:"عمودية", en:"Portrait" },
  mount:{ ar:"التثبيت", en:"Mount" }, mStand:{ ar:"قاعدة", en:"Stand" }, mArm:{ ar:"ذراع على الطاولة", en:"Desk arm" },
  scrH:{ ar:"ارتفاع الشاشة عن الطاولة", en:"Screen height above desk" }, scrColor:{ ar:"لون الشاشة", en:"Screen color" },
  lapStand:{ ar:"ستاند اللابتوب", en:"Laptop stand" }, none:{ ar:"بدون", en:"None" }, onStand:{ ar:"على ستاند", en:"On a stand" },
  model:{ ar:"الموديل", en:"Model" }, color:{ ar:"اللون", en:"Color" },
  seatH:{ ar:"ارتفاع المقعد", en:"Seat height" }, chairSize:{ ar:"حجم الكرسي", en:"Chair size" },
  place:{ ar:"المكان", en:"Placement" }, onDesk:{ ar:"عالطاولة", en:"On desk" }, onFloor:{ ar:"عالأرض", en:"On floor" },
  rgb:{ ar:"إضاءة RGB", en:"RGB lighting" }, off:{ ar:"مطفية", en:"Off" }, on:{ ar:"شغالة", en:"On" }, rgbColor:{ ar:"لون الإضاءة", en:"Light color" },
  area:{ ar:"المساحة", en:"Footprint" }, tall:{ ar:"الارتفاع", en:"height" }, cm:{ ar:"سم", en:"cm" },
  seatAt:{ ar:"المقعد على", en:"Seat at" }, deskAt:{ ar:"الطاولة على", en:"desk at" },
  outside:{ ar:"طالع برا الطاولة", en:"off the desk" },
  limit:{ ar:"وصلت للحد (24 عنصر). احذف شي أول.", en:"Limit reached (24 items). Remove something first." },
  noRoom:{ ar:"ما في مكان كافي، حطيته أقرب مكان. كبّر الطاولة أو حرّك الباقي.", en:"Not enough room, so it went to the closest spot. Enlarge the desk or move things." },
  sizeRange:{ ar:"القياس لازم يكون بين {0} و {1} إنش", en:"Size must be between {0} and {1} inches" },
  badRatio:{ ar:"اكتب نسبة أبعاد صحيحة", en:"Enter a valid aspect ratio" },
  themeToLight:{ ar:"الوضع النهاري", en:"Light mode" }, themeToDark:{ ar:"الوضع الليلي", en:"Dark mode" },
  langTitle:{ ar:"Switch to English", en:"التبديل للعربية" },
  fitOk:{ ar:"كل شي على الطاولة وما في تداخل. الطاولة {0} على ارتفاع {1} سم.", en:"Everything fits with no overlaps. Desk is {0}, {1} cm high." },
  fitEmpty:{ ar:"الطاولة فاضية.", en:"The desk is empty." },
  outOne:{ ar:"{0} طالع برا الطاولة", en:"{0} is off the desk" }, outMany:{ ar:"{0} عناصر طالعين برا الطاولة", en:"{0} items are off the desk" },
  ovPair:{ ar:"{0} داخل بـ {1}", en:"{0} is running into {1}" }, ovMore:{ ar:"(و{0} غيرهم)", en:"(+{0} more)" },
  hitsWith:{ ar:"داخل بـ {0}", en:"running into {0}" },
  fitFix:{ ar:"حرّكهم أو كبّر الطاولة، أو جرّب «رتّب تلقائيًا».", en:"Move them, enlarge the desk, or try Auto-arrange." },
  presetSmall:{ ar:"صغيرة", en:"Small" }, presetStd:{ ar:"عادية", en:"Standard" }, presetBig:{ ar:"كبيرة", en:"Large" },
  presetStand:{ ar:"مكتب واقف", en:"Standing" }, presetL:{ ar:"L زاوية", en:"L corner" },
  disclaimer:{ ar:"المقاسات والنماذج تقريبية. تحقّق من الأبعاد الرسمية للمنتج قبل الشراء.", en:"Sizes and models are approximate. Check the product's official dimensions before buying." },
  edges:{ ar:"عن الحواف: يمين {1} · يسار {0} · قدّام {2} · ورا {3} سم", en:"To edges: left {0} · right {1} · front {2} · back {3} cm" },
  chairOut:{ ar:"بعيد عن حافة الطاولة {0} سم", en:"{0} cm in front of the desk edge" },
  chairIn:{ ar:"داخل تحت الطاولة {0} سم", en:"{0} cm tucked under the desk" },
  plantSize:{ ar:"الحجم", en:"Size" },
  cw:{ ar:"العرض (سم)", en:"Width (cm)" }, cd:{ ar:"العمق (سم)", en:"Depth (cm)" }, ch:{ ar:"الارتفاع (سم)", en:"Height (cm)" },
  customName:{ ar:"الاسم", en:"Name" }, customPh:{ ar:"مثلًا: سماعة مكتبية", en:"e.g. desk speaker" },
  deskLeg:{ ar:"هيكل الطاولة", en:"the desk frame" }, deskBracket:{ ar:"دعامة الطاولة", en:"a desk bracket" }, wallWord:{ ar:"الحيط", en:"the wall" },
  tapToMove:{ ar:"انحدد. اسحبه هلق لتحرّكه", en:"Selected. Drag it now to move it" },
  noWebgl:{ ar:"ما قدرنا نشغّل العرض ثلاثي الأبعاد على هالمتصفح. جرّب متصفح أحدث أو فعّل تسريع الرسوميات.", en:"3D view couldn't start in this browser. Try a newer browser or enable hardware acceleration." },
  legs:{ ar:"نوع الأرجل", en:"Leg style" }, legColor:{ ar:"لون الأرجل", en:"Leg color" },
  export:{ ar:"تصدير", en:"Export" },
  expPng:{ ar:"صورة نظيفة للمشهد", en:"Clean scene image" }, expPngSub:{ ar:"الزاوية الحالية بدون أزرار الواجهة", en:"Current view without the interface" },
  expReport:{ ar:"تقرير كامل للسيت أب", en:"Full setup report" }, expReportSub:{ ar:"صورة فيها أربع زوايا وقائمة القطع", en:"One image with four views and the parts list" },
  exportFail:{ ar:"ما قدرنا نجهّز الصورة", en:"Couldn't prepare the image" },
  reportTitle:{ ar:"تقرير السيت أب", en:"Desk setup report" }, kvSize:{ ar:"المقاس", en:"Size" }, kvShape:{ ar:"الشكل", en:"Shape" },
  kvHeight:{ ar:"الارتفاع", en:"Height" }, kvLegs:{ ar:"الأرجل", en:"Legs" }, kvColor:{ ar:"اللون", en:"Color" },
  itemsCount:{ ar:"{0} عنصر", en:"{0} items" }, createdOn:{ ar:"تاريخ التقرير: {0}", en:"Report date: {0}" },
  expJson:{ ar:"ملف السيت أب", en:"Setup file" }, expJsonSub:{ ar:"JSON بترجع تفتحه هون وقت ما بدك", en:"JSON you can reopen here later" },
  expImport:{ ar:"افتح ملف سيت أب", en:"Open a setup file" }, expImportSub:{ ar:"ملف JSON صدّرته من قبل", en:"A JSON file you exported before" },
  saved:{ ar:"انحفظ الملف", en:"File saved" }, declined:{ ar:"ما انحفظ، إنت لغيت الحفظ", en:"Not saved: the save was cancelled" },
  busy:{ ar:"في نافذة حفظ مفتوحة، جرّب بعد شوي", en:"A save prompt is already open, try again shortly" },
  noExport:{ ar:"الحفظ مش متاح بهالعرض", en:"Saving isn't available in this view" },
  started:{ ar:"بدأ التنزيل", en:"Download started" }, preparing:{ ar:"عم جهّز الملف…", en:"Preparing the file…" },
  imported:{ ar:"انفتح السيت أب ({0} عنصر)", en:"Setup opened ({0} items)" }, badFile:{ ar:"هاد الملف مو ملف سيت أب صالح", en:"That isn't a valid setup file" },
  colName:{ ar:"الاسم", en:"Name" }, colType:{ ar:"النوع", en:"Type" }, colModel:{ ar:"الموديل", en:"Model" },
  colDims:{ ar:"الأبعاد عرض×عمق×ارتفاع (سم)", en:"Size W×D×H (cm)" }, colNotes:{ ar:"تفاصيل", en:"Details" },
  deskWord:{ ar:"الطاولة", en:"Desk" }, partsTitle:{ ar:"القطع ({0})", en:"Parts ({0})" },
  deskLine:{ ar:"طاولة {0} · ارتفاع {1} سم", en:"Desk {0} · {1} cm high" },
  undo:{ ar:"تراجع", en:"Undo" }, redo:{ ar:"إعادة", en:"Redo" }, shortcuts:{ ar:"اختصارات الكيبورد", en:"Keyboard shortcuts" }, close:{ ar:"إغلاق", en:"Close" },
  copied:{ ar:"انتسخ: {0}", en:"Copied: {0}" }, cutDone:{ ar:"انقص: {0}", en:"Cut: {0}" }, pasted:{ ar:"انلصق: {0}", en:"Pasted: {0}" },
  duplicated:{ ar:"انعملت نسخة: {0}", en:"Duplicated: {0}" }, nothingToPaste:{ ar:"ما في شي منسوخ. حدّد عنصر واكبس {0}", en:"Nothing copied yet. Select an item and press {0}" },
  undone:{ ar:"تراجعت خطوة", en:"Undone" }, redone:{ ar:"رجعت الخطوة", en:"Redone" },
  nothingUndo:{ ar:"ما في شي تتراجع عنه", en:"Nothing to undo" }, nothingRedo:{ ar:"ما في شي ترجعه", en:"Nothing to redo" },
  selectFirst:{ ar:"حدّد عنصر أول", en:"Select an item first" },
  scEditing:{ ar:"التعديل", en:"Editing" }, scItem:{ ar:"العنصر المحدد", en:"Selected item" }, scView:{ ar:"العرض", en:"View" },
  scUndo:{ ar:"تراجع", en:"Undo" }, scRedo:{ ar:"إعادة", en:"Redo" }, scCopy:{ ar:"نسخ", en:"Copy" }, scCut:{ ar:"قص", en:"Cut" },
  scPaste:{ ar:"لصق جنب الأصلي", en:"Paste next to the original" }, scDup:{ ar:"نسخة فورية", en:"Duplicate" }, scSave:{ ar:"حفظ ملف السيت أب", en:"Save setup file" },
  scDel:{ ar:"حذف", en:"Delete" }, scRot:{ ar:"تدوير 15°", en:"Rotate 15°" }, scRotBack:{ ar:"تدوير بالعكس", en:"Rotate back" }, scEdit:{ ar:"فتح أو سكّر لوحة التعديل", en:"Open or close the editor" },
  scMove:{ ar:"تحريك 1 سم", en:"Move 1 cm" }, scMoveFast:{ ar:"تحريك 5 سم", en:"Move 5 cm" },
  scViews:{ ar:"مائل، من قدّام، من فوق، من الجنب", en:"Angled, front, top, side" }, scEsc:{ ar:"إلغاء التحديد أو سكّر اللوحة", en:"Deselect or close a panel" },
  scHelp:{ ar:"عرض هالقائمة", en:"Show this list" }, or:{ ar:"أو", en:"or" }, arrows:{ ar:"الأسهم", en:"Arrows" }
};
Object.assign(STR,{"back": {"ar": "‹ رجوع", "en": "‹ Back"}, "devices": {"ar": "الأجهزة والأثاث", "en": "Devices & furniture"}, "accessories": {"ar": "الإكسسوارات والعناصر المخصصة", "en": "Accessories & custom items"}, "appearance": {"ar": "المظهر والتفاصيل", "en": "Appearance & details"}, "autoSaved": {"ar": "التغييرات تُحفظ تلقائيًا على هذا الجهاز", "en": "Changes save automatically on this device"}, "fitAll": {"ar": "عرض الكل", "en": "Fit all"}, "focusItem": {"ar": "تركيز على العنصر", "en": "Focus on item"}, "openFile": {"ar": "فتح ملف", "en": "Open file"}, "download": {"ar": "تنزيل الملف", "en": "Download file"}, "exportIntro": {"ar": "اختار نوع الملف، وبعدها اضغط تنزيل.", "en": "Choose a format, then download your file."}, "expand": {"ar": "توسيع ↑", "en": "Expand ↑"}, "collapse": {"ar": "تصغير ↓", "en": "Minimize ↓"}, "welcomeText": {"ar": "هذا ترتيب تجريبي لتبدأ منه. عدّل أبعاد الطاولة لتطابق مكتبك، وبعدها أضف أغراضك.", "en": "Start with this sample setup. Set your desk dimensions, then add your own items."}, "gotIt": {"ar": "تمام، فهمت", "en": "Got it"}, "addNamed": {"ar": "إضافة {0}", "en": "Add {0}"}, "addedNamed": {"ar": "تمت إضافة {0}", "en": "Added {0}"}, "deleted": {"ar": "تم حذف العنصر", "en": "Item deleted"}, "rangeError": {"ar": "أدخل رقمًا بين {0} و{1}", "en": "Enter a number between {0} and {1}"}, "clearConfirm": {"ar": "حذف كل العناصر من الطاولة؟ يمكنك التراجع بعدها.", "en": "Remove all items from this desk? You can undo this afterwards."}, "shortHint": {"ar": "انقر للتعديل · اسحب العنصر لتحريكه · اسحب الفراغ لتدوير المشهد", "en": "Click to edit · drag items to move · drag empty space to orbit"}, "touchHint": {"ar": "المس العنصر لتعديله · اسحبه بعد تحديده · إصبعان للتقريب", "en": "Tap to edit · drag a selected item · pinch to zoom"}});
Object.assign(STR,{"mArm": {"ar": "ذراع بمشبك على حافة الطاولة", "en": "Arm clamped to desk edge"}, "edgeMount": {"ar": "حافة التثبيت", "en": "Mounting edge"}, "edgeAuto": {"ar": "تلقائي: أقرب حافة", "en": "Auto: nearest edge"}, "edgeBack": {"ar": "الخلف", "en": "Back"}, "edgeFront": {"ar": "الأمام", "en": "Front"}, "edgeLeft": {"ar": "اليسار", "en": "Left"}, "edgeRight": {"ar": "اليمين", "en": "Right"}, "edgeHint": {"ar": "اسحب الحامل بمحاذاة الحافة. التدوير ينقله للحافة التالية، والمشبك يتكيّف مع سماكة الطاولة.", "en": "Drag along an edge. Rotate switches to the next edge; the clamp follows the desktop thickness."}, "screenShape": {"ar": "شكل الشاشة", "en": "Screen shape"}, "flatScreen": {"ar": "مسطحة", "en": "Flat"}, "curvedScreen": {"ar": "منحنية", "en": "Curved"}, "curveNote": {"ar": "انحناء تمثيلي؛ المقاسات الفعلية تختلف حسب موديل الشاشة.", "en": "Illustrative curvature; actual dimensions vary by monitor model."}, "thickness": {"ar": "سماكة اللوح (سم)", "en": "Desktop thickness (cm)"}, "weightTitle": {"ar": "وزن المعدات على الطاولة", "en": "Equipment load on desk"}, "weightKg": {"ar": "وزن العنصر مع حامله (كغ)", "en": "Item weight including its stand (kg)"}, "weightHint": {"ar": "التقدير افتراضي قابل للتعديل. أدخل الوزن الفعلي من مواصفات القطعة؛ وزن الحامل داخل هذا الرقم.", "en": "Editable planning estimate. Enter the actual item weight from its specifications; include its stand."}, "weightUnknownItem": {"ar": "الوزن غير معروف — أدخله ليُحتسب.", "en": "Weight unknown — enter it to include it."}, "weightReset": {"ar": "استخدام التقدير الافتراضي", "en": "Use default estimate"}, "capacity": {"ar": "حد التحمل المعلن (كغ، اختياري)", "en": "Rated load capacity (kg, optional)"}, "capacityHint": {"ar": "من مواصفات الطاولة أو الشركة المصنّعة. اتركه فارغًا إذا غير معروف. السماكة وحدها لا تحدد التحمل.", "en": "Use the desk manufacturer’s rating. Leave blank if unknown. Thickness alone does not determine capacity."}, "loadTotal": {"ar": "الوزن المحتسب ≈ {0} كغ", "en": "Counted load ≈ {0} kg"}, "loadUnknown": {"ar": "{0} عنصر بدون وزن؛ المجموع غير مكتمل.", "en": "{0} item(s) have no weight; total is incomplete."}, "loadNoRating": {"ar": "حد التحمل غير معروف؛ لا يمكن تقييم التحمل.", "en": "Load capacity unknown; capacity cannot be assessed."}, "loadOver": {"ar": "قد لا تتحمل الطاولة هذه الأوزان: المجموع يتجاوز حد {0} كغ المدخل.", "en": "The desk may not support this load: it exceeds the entered {0} kg limit."}, "loadNear": {"ar": "الوزن قريب من حد {0} كغ المدخل (90% أو أكثر).", "en": "Load is close to the entered {0} kg limit (90% or more)."}, "loadBelow": {"ar": "المجموع أقل من حد {0} كغ المدخل؛ هذا ليس تأكيدًا للسلامة.", "en": "Total is below the entered {0} kg limit; this does not certify safety."}, "loadNote": {"ar": "يشمل المعدات على الطاولة والمعلّقة بها فقط. التوزيع والمشابك والدعامات تؤثر على التحمل؛ هذا تقدير تخطيطي، وليس فحصًا إنشائيًا.", "en": "Includes equipment on or attached to the desk only. Distribution, clamps and supports affect capacity; this is a planning estimate, not a structural assessment."}, "loadReport": {"ar": "الحمل ≈ {0} كغ · الحد: {1}", "en": "Load ≈ {0} kg · capacity: {1}"}, "unknownWeight": {"ar": "غير معروف", "en": "Unknown"}, "kg": {"ar": "كغ", "en": "kg"}, "deskTop": {"ar": "لوح الطاولة", "en": "Desktop"}, "weightDetails": {"ar": "الوزن التقريبي", "en": "Estimated weight"}, "weightColumn": {"ar": "الوزن (كغ، يشمل الحامل)", "en": "Weight (kg, including stand)"}});
Object.assign(STR,{"expExcel": {"ar": "قائمة المعدات — Excel", "en": "Equipment list — Excel"}, "expExcelSub": {"ar": "ملف XLSX منسّق بالمقاسات والأوزان", "en": "Formatted XLSX with dimensions and weights"}, "excelSnapshot": {"ar": "بيانات التصميم وقت التصدير", "en": "Setup snapshot at export"}, "excelEstimateNote": {"ar": "الأوزان تقديرية أو مدخلة يدويًا. الخانة الفارغة تعني وزنًا غير معروف.", "en": "Weights are estimates or manually entered. A blank cell means unknown weight."}, "deskWeightColumn": {"ar": "الحمل على الطاولة (كغ)", "en": "Load on desk (kg)"}, "savedColor": {"ar": "اللون المحفوظ", "en": "Saved color"}});
function t(k){ var s=STR[k]; if(!s) return k; var v=s[settings.lang]||s.ar; for(var i=1;i<arguments.length;i++) v=v.replace("{"+(i-1)+"}", arguments[i]); return v; }
function L(o){ return o ? (o[settings.lang] || o.ar) : ""; }

/* ================= catalog ================= */
var ICONS={
  monitor:'<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8"/>',
  laptop:'<rect x="5" y="5" width="14" height="10" rx="1.2"/><path d="M2.5 19h19"/>',
  pc:'<rect x="7" y="2.5" width="10" height="19" rx="1.5"/><circle cx="12" cy="14.5" r="2.6"/><path d="M10 6h4"/>',
  keyboard:'<rect x="2" y="7" width="20" height="10" rx="1.5"/><path d="M6 10.5h.01M9.5 10.5h.01M13 10.5h.01M16.5 10.5h.01M7 14h10"/>',
  mouse:'<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>',
  mousepad:'<rect x="3" y="6" width="18" height="12" rx="2"/><rect x="13" y="9" width="4" height="6" rx="2"/>',
  chair:'<path d="M8 3h8v8H8z"/><path d="M6 12h12v3H6zM12 15v4M8 21l4-2 4 2"/>',
  riser:'<rect x="4" y="3" width="16" height="9" rx="1"/><path d="M2.5 15h19M4.5 15v5M19.5 15v5"/>',
  mic:'<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8.5 21h7"/>',
  micArm:'<path d="M4 21v-8l7-6 6 5"/><rect x="15.5" y="11" width="4" height="7" rx="2"/><path d="M2 21h5"/>',
  headphones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
  custom:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  plant:'<path d="M7 15h10l-1.2 6H8.2z"/><path d="M12 15V9"/><path d="M12 10c0-3 2-5 5-5 0 3-2 5-5 5zM12 12c0-2.5-1.8-4.3-4.5-4.3 0 2.5 1.8 4.3 4.5 4.3z"/>'
};
function icon(k){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[k]+'</svg>'; }
var SUN='<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON='<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

var KINDS={
  monitor:{ name:{ar:"شاشة",en:"Monitor"}, order:1, withLabel:false },
  laptop:{ name:{ar:"لابتوب",en:"Laptop"}, order:2, withLabel:false },
  pc:{ name:{ar:"كمبيوتر",en:"PC"}, order:3, withLabel:true },
  riser:{ name:{ar:"رف شاشة",en:"Monitor shelf"}, order:4, withLabel:false },
  keyboard:{ name:{ar:"كيبورد",en:"Keyboard"}, order:5, withLabel:true },
  mousepad:{ name:{ar:"ماوس باد",en:"Mouse pad"}, order:6, withLabel:true },
  mouse:{ name:{ar:"ماوس",en:"Mouse"}, order:7, withLabel:true },
  headphones:{ name:{ar:"سماعة رأس",en:"Headphones"}, order:8, withLabel:true },
  mic:{ name:{ar:"مايك",en:"Mic"}, order:9, withLabel:false },
  micArm:{ name:{ar:"ستاند مايك",en:"Mic stand"}, order:10, withLabel:false },
  plant:{ name:{ar:"زرعة زينة",en:"Plant"}, order:11, withLabel:false },
  chair:{ name:{ar:"كرسي",en:"Chair"}, order:12, withLabel:true },
  custom:{ name:{ar:"عنصر مخصص",en:"Custom item"}, order:13, withLabel:false }
};
var MAIN_KINDS=["monitor","laptop","pc","keyboard","mouse","mousepad","headphones","chair"];
var EXTRA_KINDS=["riser","mic","micArm","plant","custom"];
var PLANT_SIZES=[[0.75,"75%"],[1,"100%"],[1.25,"125%"],[1.5,"150%"]];
function plantScale(it){ var v=+it.size; return PLANT_SIZES.some(function(p){ return p[0]===v; }) ? v : 1; }
function layerOf(it){
  if(it.kind==="chair") return "floor";
  if(it.kind==="pc") return it.place==="floor" ? "floor" : "desk";
  if(it.kind==="micArm") return it.variant==="floor" ? "floor" : "desk";
  if(it.kind==="plant") return it.variant==="floor" ? "floor" : "desk";
  if(it.kind==="custom") return it.place==="floor" ? "floor" : "desk";
  return "desk";
}
function groupOf(it){
  if(layerOf(it)==="floor") return "floor";
  if(it.kind==="mousepad") return "mat";
  if(it.kind==="riser") return "riser";
  if(it.kind==="micArm") return "air";
  if(it.kind==="headphones" && it.variant==="hook") return "air";
  return "desk";
}
function liftRank(it){ return it.kind==="mousepad" ? 1 : it.kind==="riser" ? 2 : 3; }

var SCREEN={
  monitor:{ min:15, max:65, ratios:["16:9","16:10","21:9","32:9","4:3"], presets:[[24,"16:9"],[27,"16:9"],[32,"16:9"],[34,"21:9"],[49,"32:9"]] },
  laptop:{ min:10, max:19, ratios:["16:10","16:9","3:2"], presets:[[13.3,"16:10"],[14,"16:10"],[15.6,"16:9"],[16,"16:10"],[17.3,"16:9"]] }
};
var VARIANTS={
  keyboard:[
    { id:"full", name:{ar:"كامل 100%",en:"Full-size 100%"}, w:17.4, d:5.4, h:1.3, units:22.5 },
    { id:"tkl", name:{ar:"بدون أرقام TKL",en:"Tenkeyless"}, w:14.3, d:5.3, h:1.3, units:18.25 },
    { id:"75", name:{ar:"مدمج 75%",en:"Compact 75%"}, w:12.6, d:5.2, h:1.3, units:16.25 },
    { id:"60", name:{ar:"صغير 60%",en:"Mini 60%"}, w:11.5, d:4.0, h:1.2, units:15 }
  ],
  mouse:[
    { id:"std", name:{ar:"عادي",en:"Standard"}, w:2.5, d:4.8, h:1.5 },
    { id:"gaming", name:{ar:"ألعاب كبير",en:"Large gaming"}, w:2.7, d:5.1, h:1.65 },
    { id:"compact", name:{ar:"صغير للسفر",en:"Compact travel"}, w:2.2, d:3.9, h:1.25 },
    { id:"vertical", name:{ar:"عمودي مريح",en:"Vertical ergonomic"}, w:3.0, d:4.7, h:2.8 }
  ],
  mousepad:[
    { id:"s", name:{ar:"صغير",en:"Small"}, w:25*CM, d:21*CM },
    { id:"l", name:{ar:"كبير",en:"Large"}, w:45*CM, d:40*CM },
    { id:"xl", name:{ar:"بعرض المكتب",en:"Desk mat"}, w:90*CM, d:40*CM }
  ],
  chair:[
    { id:"ergo", name:{ar:"مريح شبكي",en:"Ergonomic mesh"}, seatW:20, seatD:19, seatH:18.5, backH:23, backW:19, arms:true, head:true, legR:12.5, wings:false },
    { id:"gaming", name:{ar:"ألعاب",en:"Gaming"}, seatW:21, seatD:20, seatH:19.5, backH:31, backW:21, arms:true, head:false, legR:13.5, wings:true },
    { id:"task", name:{ar:"بسيط بدون مساند",en:"Armless task"}, seatW:18, seatD:17, seatH:18.5, backH:15, backW:17, arms:false, head:false, legR:11.5, wings:false }
  ],
  pc:[
    { id:"itx", name:{ar:"صغير ITX",en:"Mini ITX"}, w:19, h:32, d:37, fans:2 },
    { id:"mid", name:{ar:"متوسط",en:"Mid tower"}, w:22, h:48, d:46, fans:3 },
    { id:"full", name:{ar:"كبير",en:"Full tower"}, w:24, h:58, d:56, fans:3 }
  ],
  riser:[
    { id:"single", name:{ar:"رف لشاشة وحدة",en:"Single riser"}, w:55, d:22, h:10 },
    { id:"dual", name:{ar:"رف طويل لشاشتين",en:"Long dual riser"}, w:100, d:24, h:11 }
  ],
  mic:[
    { id:"desk", name:{ar:"مايك مكتبي",en:"Desk USB mic"}, tall:29, base:12, r:3.6 },
    { id:"compact", name:{ar:"مايك صغير",en:"Compact mic"}, tall:18, base:9, r:2.4 }
  ],
  micArm:[
    { id:"boom", name:{ar:"ذراع مايك على الطاولة",en:"Desk boom arm"}, reach:70 },
    { id:"floor", name:{ar:"ستاند مايك أرضي",en:"Floor mic stand"}, tall:150 }
  ],
  headphones:[
    { id:"stand", name:{ar:"على ستاند",en:"On a stand"}, tall:28 },
    { id:"flat", name:{ar:"ممددة عالطاولة",en:"Resting flat"}, tall:8 },
    { id:"hook", name:{ar:"معلّقة تحت حافة الطاولة",en:"Hung under the desk edge"}, tall:22 }
  ],
  plant:[
    { id:"cactus", name:{ar:"صبّار صغير",en:"Small cactus"}, tall:20, pot:10 },
    { id:"leafy", name:{ar:"نبتة مكتب ورقية",en:"Leafy desk plant"}, tall:36, pot:14 },
    { id:"trailing", name:{ar:"نبتة متدلّية",en:"Trailing pothos"}, tall:22, pot:13 },
    { id:"floor", name:{ar:"نبتة أرضية كبيرة",en:"Large floor plant"}, tall:120, pot:32 }
  ]
};
var POT_COLORS=[ {hex:"#b8653f",n:{ar:"فخار",en:"Terracotta"}}, {hex:"#ecebe6",n:{ar:"أبيض",en:"White"}}, {hex:"#2a2b2e",n:{ar:"أسود",en:"Black"}},
  {hex:"#8a977c",n:{ar:"زيتي",en:"Sage"}}, {hex:"#c9a3b8",n:{ar:"وردي",en:"Pink"}} ];
var LEG_STYLES=[
  { id:"four", n:{ar:"أربع أرجل",en:"Four legs"}, d:{ar:"الشكل الكلاسيكي",en:"The classic look"} },
  { id:"tframe", n:{ar:"إطار T",en:"T-frame"}, d:{ar:"متل المكاتب الواقفة",en:"Like standing desks"} },
  { id:"sled", n:{ar:"إطار مستطيل",en:"Sled frame"}, d:{ar:"إطار معدني مغلق",en:"Closed metal loop"} },
  { id:"x", n:{ar:"أرجل متقاطعة X",en:"X-legs"}, d:{ar:"شكل حرف X من الجنب",en:"X shape from the side"} },
  { id:"panel", n:{ar:"ألواح جانبية",en:"Panel sides"}, d:{ar:"ألواح عالجنبين ولوح خلفي",en:"Side panels and a back panel"} },
  { id:"wall", n:{ar:"معلّقة بالحائط",en:"Wall-mounted"}, d:{ar:"دعامات تحتها مثبتة بالحيط",en:"Brackets fixed to the wall"} }
];
var LEG_COLORS=[ {id:"black",hex:"#2a2b2e",n:{ar:"أسود",en:"Black"}}, {id:"white",hex:"#e3e3df",n:{ar:"أبيض",en:"White"}},
  {id:"silver",hex:"#b9bdc2",n:{ar:"فضي",en:"Silver"},metal:true}, {id:"wood",hex:"#a87b50",n:{ar:"متل الطاولة",en:"Match desk"}} ];
var ACC_COLORS=[ {hex:"#1f2023",n:{ar:"أسود",en:"Black"}}, {hex:"#e9e8e3",n:{ar:"أبيض",en:"White"}}, {hex:"#8a8e95",n:{ar:"رمادي",en:"Gray"}},
  {hex:"#2f5b9c",n:{ar:"أزرق",en:"Blue"}}, {hex:"#9e3b3b",n:{ar:"أحمر",en:"Red"}}, {hex:"#c9a3b8",n:{ar:"وردي",en:"Pink"}} ];
function itemColors(it){
  var choices={mic:[0,1,5],micArm:[0,1],headphones:[0,1,5],mouse:[0,1,5],keyboard:[0,1,2,3,5],mousepad:[0,2,3,5],chair:it.variant==='gaming'?[0,1,2,4]:[0,1,2]};
  var colors=it.kind==='pc'?PC_COLORS:it.kind==='riser'?RISER_COLORS:it.kind==='plant'?POT_COLORS:choices[it.kind]?choices[it.kind].map(function(i){return ACC_COLORS[i];}):ACC_COLORS;
  if(it.color&&!colors.some(function(c){return c.hex===it.color;}))colors=colors.concat([{hex:it.color,n:{ar:STR.savedColor.ar,en:STR.savedColor.en}}]);
  return colors;
}
var PC_COLORS=[ {hex:"#1f2023",n:{ar:"أسود",en:"Black"}}, {hex:"#e9e8e3",n:{ar:"أبيض",en:"White"}}, {hex:"#6b7079",n:{ar:"رمادي",en:"Gray"}} ];
var RGB_COLORS=[ {hex:"#35d3ff",n:{ar:"سماوي",en:"Cyan"}}, {hex:"#a45cff",n:{ar:"بنفسجي",en:"Purple"}}, {hex:"#ff4fa3",n:{ar:"زهري",en:"Pink"}},
  {hex:"#39e07a",n:{ar:"أخضر",en:"Green"}}, {hex:"#ff8a3d",n:{ar:"برتقالي",en:"Orange"}}, {hex:"#f4f4f4",n:{ar:"أبيض",en:"White"}} ];
var RISER_COLORS=[ {hex:"#a87b50",n:{ar:"خشب",en:"Wood"}}, {hex:"#1f2023",n:{ar:"أسود",en:"Black"}}, {hex:"#e9e8e3",n:{ar:"أبيض",en:"White"}} ];
var SCREEN_COLORS=["#2f5b9c","#c1622b","#2f7a58","#b98a2e","#6a4c93","#a33d4a","#2f7f8c","#8a5a2e"];
var DESK_COLORS=[
  { id:"oak", n:{ar:"خشب فاتح",en:"Light oak"}, base:"#b98c5d", grain:true },
  { id:"walnut", n:{ar:"جوزي",en:"Walnut"}, base:"#6b4630", grain:true },
  { id:"white", n:{ar:"أبيض",en:"White"}, base:"#ecebe6", grain:false },
  { id:"black", n:{ar:"أسود",en:"Black"}, base:"#2a2a2d", grain:false },
  { id:"gray", n:{ar:"رمادي",en:"Gray"}, base:"#8f9296", grain:false },
  { id:"sage", n:{ar:"أخضر زيتي",en:"Sage"}, base:"#8a977c", grain:false }
];

function variantOf(it){ var l=VARIANTS[it.kind]||[]; for(var i=0;i<l.length;i++) if(l[i].id===it.variant) return l[i]; return l[0]; }
function chairSpec(it){
  var v=variantOf(it), s=isNum(it.scale)?it.scale:1, o={};
  for(var k in v) o[k]=v[k];
  o.seatW=v.seatW*s; o.seatD=v.seatD*s; o.backH=v.backH*s; o.backW=v.backW*s; o.legR=v.legR*clamp(s,0.9,1.15);
  o.seatH=isNum(it.seatH)?it.seatH:v.seatH;
  o.total=o.seatH+2+o.backH+(v.head?6:0);
  return o;
}
function dims(){ return "\u2066"+Array.prototype.join.call(arguments,"×")+"\u2069"; }
function variantMeta(kind, v){
  if(kind==="chair") return t("seatAt")+" "+toCm(v.seatH)+" · "+toCm(v.seatH+2+v.backH+(v.head?6:0))+" "+t("cm");
  if(kind==="pc") return dims(v.w,v.d,v.h)+" "+t("cm");
  if(kind==="riser") return dims(v.w,v.d)+" · "+v.h+" "+t("cm");
  if(kind==="mic") return v.tall+" "+t("cm");
  if(kind==="micArm") return v.reach ? (v.reach+" "+t("cm")) : (v.tall+" "+t("cm"));
  if(kind==="headphones"||kind==="plant") return v.tall+" "+t("cm");
  return dims(toCm(v.w),toCm(v.d))+" "+t("cm");
}
function screenDims(it){ var d=Math.sqrt(it.ratioW*it.ratioW+it.ratioH*it.ratioH), k=it.diagonal/d, w=k*it.ratioW, h=k*it.ratioH;
  return it.portrait ? { w:h, h:w } : { w:w, h:h }; }
function autoNameIn(it,lang){
  var k=KINDS[it.kind], kn=k.name[lang]||k.name.ar;
  if(it.kind==="monitor"||it.kind==="laptop") return kn+" "+fmt(it.diagonal)+'"';
  if(it.kind==="custom") return kn;
  var v=variantOf(it), vn=v?(v.name[lang]||v.name.ar):"";
  return k.withLabel ? kn+" "+vn : vn;
}
/* a stored name that is just an automatic label (in either language) is treated as "no name",
   so it keeps following the interface language */
function isAutoName(it,name){
  var n=String(name||"").trim(); if(!n) return true;
  var k=KINDS[it.kind];
  return n===k.name.ar || n===k.name.en || n===autoNameIn(it,"ar") || n===autoNameIn(it,"en");
}
function cleanName(v){ return String(v==null?"":v).replace(/[<>\u0000-\u001f\u007f]/g,"").trim().slice(0,60); }
function nameOf(it){
  if(it.name && !isAutoName(it,it.name)) return it.name;
  return autoNameIn(it,settings.lang);
}
function metaOf(it){
  if(it.kind==="monitor"||it.kind==="laptop"){
    var d=screenDims(it), s="\u2066"+it.ratioW+":"+it.ratioH+"\u2069 · "+dims(toCm(d.w),toCm(d.h))+" "+t("cm");
    if(it.curved)s+=" · "+t("curvedScreen");
    if(it.portrait) s+=" · "+t("portrait"); if(it.kind==="laptop" && it.stand) s+=" · "+t("onStand"); if(it.mount==="arm") s+=" · "+t("mArm");
    return s;
  }
  if(it.kind==="chair"){ var c=chairSpec(it); return t("seatAt")+" "+toCm(c.seatH)+" "+t("cm"); }
  if(it.kind==="custom") return dims(Math.round(it.w),Math.round(it.d),Math.round(it.h))+" "+t("cm")+" · "+(it.place==="floor"?t("onFloor"):t("onDesk"));
  if(it.kind==="plant") return Math.round(variantOf(it).tall*plantScale(it))+" "+t("cm")+(plantScale(it)!==1?" · "+Math.round(plantScale(it)*100)+"%":"");
  var m=variantMeta(it.kind, variantOf(it));
  if(it.kind==="pc") m+=" · "+(it.place==="floor"?t("onFloor"):t("onDesk"));
  return m;
}

function itemWeight(it){
  if(it.weightKg===null)return null;
  if(isNum(it.weightKg)&&it.weightKg>=0)return it.weightKg;
  var w={laptop:1.6,keyboard:0.8,mouse:0.1,mousepad:0.4,mic:0.6,riser:3,headphones:0.5,micArm:2.2,chair:15};
  if(it.kind==='custom')return null;
  if(it.kind==='monitor')return Math.round((Math.pow((it.diagonal||27)/27,2)*4+(it.mount==='arm'?2:1))*10)/10;
  if(it.kind==='pc')return {itx:6,mid:10,full:15}[it.variant]||10;
  if(it.kind==='plant')return Math.round(({cactus:0.5,leafy:1.5,trailing:1.2,floor:6}[it.variant]||1.5)*Math.pow(plantScale(it),3)*10)/10;
  return w[it.kind]===undefined?null:w[it.kind];
}
function deskLoad(){
  var total=0,unknown=0;items.forEach(function(it){if(layerOf(it)==='floor')return;var w=itemWeight(it);if(w===null)unknown++;else total+=w;});
  total=Math.round(total*10)/10;var capacity=desk.capacity,level=capacity&&total>capacity?'over':capacity&&total>=capacity*0.9?'near':'normal';
  return {total:total,unknown:unknown,capacity:capacity,level:level};
}
function loadMessage(load){return t(load.capacity?(load.level==='over'?'loadOver':load.level==='near'?'loadNear':'loadBelow'):'loadNoRating',load.capacity);}
function loadSummary(){var l=deskLoad();return t('loadReport',fmt(l.total),l.capacity?fmt(l.capacity)+' '+t('kg'):t('unknownWeight'))+(l.unknown?' · '+t('loadUnknown',l.unknown):'');}
function renderLoad(){
  var load=deskLoad(),box=document.getElementById('loadSummary');if(!box)return;box.replaceChildren();box.className='fit'+(load.level!=='normal'||load.unknown?' bad':'');
  box.appendChild(el('strong',null,t('loadTotal',fmt(load.total))));box.appendChild(el('p',null,loadMessage(load)));
  if(load.unknown)box.appendChild(el('p',null,t('loadUnknown',load.unknown)));
}
/* ================= state ================= */
var ITEMS_KEY="desk-planner-3d.items.v4", DESK_KEY="desk-planner-3d.desk.v2";
function loadItems(){
  try{
    var raw=localStorage.getItem(ITEMS_KEY)||localStorage.getItem("desk-planner-3d.items.v3");
    if(raw){
      var a=JSON.parse(raw);
      if(Array.isArray(a)){
        var seen={}, next=1, out=[];
        a.forEach(function(x){ var o=sanitizeItem(x); if(!o) return; if(!isNum(o.id)||seen[o.id]) o.id=0; out.push(o); if(o.id){ seen[o.id]=1; next=Math.max(next,o.id+1); } });
        out.forEach(function(o){ if(!o.id) o.id=next++; });
        return out.slice(0,24);
      }
    }
  }catch(e){}
  return null;
}
var items=loadItems() || [
  { id:1, kind:"monitor", diagonal:27, ratioW:16, ratioH:9, color:SCREEN_COLORS[0], mount:"stand" },
  { id:2, kind:"laptop", diagonal:14, ratioW:16, ratioH:10, color:SCREEN_COLORS[1], stand:true },
  { id:3, kind:"keyboard", variant:"tkl", color:"#1f2023" },
  { id:4, kind:"mousepad", variant:"l", color:"#8a8e95" },
  { id:5, kind:"mouse", variant:"std", color:"#1f2023" },
  { id:6, kind:"pc", variant:"mid", color:"#1f2023", place:"floor", rgb:true, rgbColor:"#35d3ff" },
  { id:7, kind:"chair", variant:"ergo", color:"#1f2023", scale:1 }
];
var nextId=items.reduce(function(m,x){ return Math.max(m,x.id||0); },0)+1;
var screenColorIdx=items.length;
function saveItems(){ try{ localStorage.setItem(ITEMS_KEY, JSON.stringify(items)); }catch(e){} recordSoon(); }

var desk={ shape:"rect", w:140, d:70, h:75, rl:140, rd:60, color:"oak", legs:"four", legColor:"black", thickness:3, capacity:null };
function applyDeskData(d){
  if(!d || !(+d.w>0)) return false;
  desk.thickness=isNum(d.thickness)?clamp(d.thickness,0.5,15):3;
  desk.capacity=isNum(d.capacity)&&d.capacity>0&&d.capacity<=2000?d.capacity:null;
  desk.w=clamp(Math.round(+d.w),60,400); desk.d=clamp(Math.round(+d.d||70),40,150); desk.h=clamp(Math.round(+d.h||75),40,130);
  desk.shape=["rect","lRight","lLeft"].indexOf(d.shape)>=0?d.shape:"rect";
  desk.rl=clamp(Math.round(+d.rl||desk.d+40),desk.d+20,320); desk.rd=clamp(Math.round(+d.rd||60),35,Math.min(150,desk.w-20));
  if(DESK_COLORS.some(function(c){ return c.id===d.color; })) desk.color=d.color;
  if(LEG_STYLES.some(function(c){ return c.id===d.legs; })) desk.legs=d.legs;
  if(LEG_COLORS.some(function(c){ return c.id===d.legColor; })) desk.legColor=d.legColor;
  return true;
}
try{ applyDeskData(JSON.parse(localStorage.getItem(DESK_KEY)||"null") || JSON.parse(localStorage.getItem("monitor-compare-3d.desk.v1")||"null")); }catch(e){}
function saveDesk(){ try{ localStorage.setItem(DESK_KEY, JSON.stringify(desk)); }catch(e){} recordSoon(); }
var MOD=/Mac|iPhone|iPad/.test(navigator.platform||navigator.userAgent||"")?"⌘":"Ctrl";

/* ---- undo / redo history: snapshots of {items, desk}, coalesced while dragging sliders ---- */
var hist=[], hIdx=-1, hTimer=null, restoring=false;
function snapshot(){ return JSON.stringify({ items:items, desk:desk }); }
function recordNow(){
  clearTimeout(hTimer); hTimer=null;
  var snap=snapshot(); if(hIdx>=0 && hist[hIdx]===snap){ paintHistory(); return; }
  hist=hist.slice(0,hIdx+1); hist.push(snap); if(hist.length>120) hist.shift(); hIdx=hist.length-1; paintHistory();
}
function recordSoon(){ if(restoring) return; clearTimeout(hTimer); hTimer=setTimeout(recordNow,350); paintHistory(); }
function paintHistory(){
  var u=document.getElementById("undoBtn"), r=document.getElementById("redoBtn"); if(!u) return;
  u.disabled=!(hIdx>0 || hTimer); r.disabled=!(hIdx<hist.length-1) || !!hTimer;
}
var DESK_TOP=1.2, DESK_W, DESK_D, DESK_H;

/* ================= three.js core ================= */
var canvas=document.getElementById("scene");
function fatal(){
  var lang=settings.lang, box0=document.createElement("div");
  box0.setAttribute("role","alert");
  box0.style.cssText="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font:15px/1.7 var(--font);color:var(--ink);background:var(--bg);z-index:50";
  box0.textContent=(STR.noWebgl[lang]||STR.noWebgl.ar);
  document.body.appendChild(box0);
}
var renderer;
try{ if(!window.THREE) throw new Error("three missing"); renderer=new THREE.WebGLRenderer({ canvas:canvas, antialias:true }); }
catch(err){ fatal(); return; }
var SMALL=window.matchMedia && matchMedia("(pointer:coarse)").matches;
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, SMALL?1.5:2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;
var ANISO=renderer.capabilities.getMaxAnisotropy();
var scene=new THREE.Scene();
var camera=new THREE.PerspectiveCamera(40,1,0.5,4000);
var hemi=new THREE.HemisphereLight(0xffffff,0x8a7f6c,0.72); scene.add(hemi);
var key=new THREE.DirectionalLight(0xfff4e2,0.85);
key.castShadow=true; key.shadow.mapSize.set(SMALL?1024:2048, SMALL?1024:2048); key.shadow.bias=-0.0006; key.shadow.normalBias=0.03;
scene.add(key); scene.add(key.target);
var fillL=new THREE.DirectionalLight(0xe1eaff,0.65); fillL.position.set(70,65,60); scene.add(fillL);
var ambient=new THREE.AmbientLight(0xffffff,0.25);scene.add(ambient);
var floor=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000), new THREE.MeshStandardMaterial({ color:0xcfc6b2, roughness:1 }));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
var world=new THREE.Group(); scene.add(world);
var itemsGroup=new THREE.Group(); world.add(itemsGroup);
var deskGroup=null;

var P={};
function applyScenePalette(){
  var d=settings.theme==="dark";
  P={ dark:d, bezel:d?0x0c0c0e:0x1a1a1d, stand:d?0x2a2b2f:0x3a3b40, bulge:d?0x16171a:0x26272b, alu:d?0x6d7076:0xaeb2b8, lid:d?0x0c0c0e:0x141416,
      deck:d?"#55585e":"#b9bcc1", deckKey:d?"#1d1e21":"#2a2b2f", pad:d?"#4a4d53":"#a9acb2", sel:d?0x8eaae3:0x2f6bd8 };
  var bg=d?0x29313c:0xe8edf2;
  renderer.setClearColor(bg,1);
  scene.fog=new THREE.Fog(bg,240,850);
  floor.material.color.copy(lin(d?0x343d49:0xd5dde5));
  hemi.color.set(0xffffff);hemi.groundColor.set(d?0x8793a5:0xc4ccd5);hemi.intensity=d?1.05:0.9;
  key.intensity=d?0.9:0.85;fillL.intensity=d?0.7:0.5;ambient.intensity=d?0.3:0.18; if(typeof bump==="function") bump();
}

function lin(c){ return new THREE.Color(c).convertSRGBToLinear(); }
function mat(c,rough,metal){ return new THREE.MeshStandardMaterial({ color:lin(c), roughness:rough, metalness:metal||0 }); }
function glow(c){ return new THREE.MeshBasicMaterial({ color:lin(c), toneMapped:false }); }
function box(w,h,d,m){ var o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.castShadow=true; o.receiveShadow=true; return o; }
function cyl(rt,rb,h,m,seg){ var o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||20),m); o.castShadow=true; o.receiveShadow=true; return o; }
function rod(a,b,r,m){ var dir=new THREE.Vector3().subVectors(b,a), len=dir.length(); var c=cyl(r,r,len,m,12); c.userData.rod={ len:len, r:r };
  c.position.copy(a).addScaledVector(dir,0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize()); return c; }
function V(x,y,z){ return new THREE.Vector3(x,y,z); }
function canvasTex(c){ var tx=new THREE.CanvasTexture(c); tx.encoding=THREE.sRGBEncoding; tx.anisotropy=ANISO; return tx; }
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function disposeTree(o){
  o.traverse(function(n){
    if(n.geometry) n.geometry.dispose();
    if(n.material) (Array.isArray(n.material)?n.material:[n.material]).forEach(function(m){ if(m.map && !m.map.isSharedTex) m.map.dispose(); m.dispose(); });
  });
}

/* ================= textures ================= */
var deskTexCache={};
function deskTexture(dc){
  if(deskTexCache[dc.id]) return deskTexCache[dc.id];
  var c=document.createElement("canvas"); c.width=1024; c.height=512; var g=c.getContext("2d");
  g.fillStyle=dc.base; g.fillRect(0,0,1024,512);
  if(dc.grain){
    for(var i=0;i<260;i++){
      var y=Math.random()*512; g.strokeStyle="rgba(50,28,10,"+(0.04+Math.random()*0.1)+")"; g.lineWidth=0.6+Math.random()*2.2;
      g.beginPath(); g.moveTo(0,y); for(var x=0;x<=1024;x+=64) g.lineTo(x, y+Math.sin((x+i*37)/180)*4+(Math.random()-0.5)*1.5); g.stroke();
    }
  } else {
    var img=g.getImageData(0,0,1024,512), dt=img.data;
    for(var p=0;p<dt.length;p+=4){ var n=(Math.random()-0.5)*7; dt[p]+=n; dt[p+1]+=n; dt[p+2]+=n; }
    g.putImageData(img,0,0);
  }
  var tx=canvasTex(c); tx.wrapS=tx.wrapT=THREE.RepeatWrapping; tx.isSharedTex=true; deskTexCache[dc.id]=tx; return tx;
}
function screenTexture(it,w,h){
  var pw=768, ph=Math.max(96, Math.round(pw*h/w));
  if(ph>1400){ ph=1400; pw=Math.round(ph*w/h); }
  var c=document.createElement("canvas"); c.width=pw; c.height=ph; var g=c.getContext("2d");
  var gr=g.createLinearGradient(0,0,pw,ph); gr.addColorStop(0,it.color); gr.addColorStop(1,mix(it.color,"#000000",0.35));
  g.fillStyle=gr; g.fillRect(0,0,pw,ph);
  g.textAlign="center"; g.textBaseline="middle"; g.fillStyle="#fff";
  var big=clamp(Math.min(ph,pw)*0.26,30,110);
  g.font="700 "+big+"px 'Cairo', 'Segoe UI', Tahoma, sans-serif"; g.fillText(fmt(it.diagonal)+'"', pw/2, ph/2-big*0.3);
  g.globalAlpha=0.85; g.font="500 "+(big*0.3)+"px 'Cairo', 'Segoe UI', Tahoma, sans-serif";
  var label=(it.name && !isAutoName(it,it.name)) ? it.name : L(KINDS[it.kind].name);
  g.fillText(label+"  "+it.ratioW+":"+it.ratioH, pw/2, ph/2+big*0.5);
  return canvasTex(c);
}
function laptopDeckTexture(bw,bd){
  var pw=768, ph=Math.round(pw*bd/bw); var c=document.createElement("canvas"); c.width=pw; c.height=ph; var g=c.getContext("2d");
  g.fillStyle=P.deck; g.fillRect(0,0,pw,ph);
  var kx0=pw*0.08,kx1=pw*0.92,ky0=ph*0.07,ky1=ph*0.52,rows=6,cols=14,gw=(kx1-kx0)/cols,gh=(ky1-ky0)/rows;
  g.fillStyle=P.deckKey;
  for(var r=0;r<rows;r++) for(var k=0;k<cols;k++){ if(r===5&&k>4&&k<10) continue; var ww=gw*0.84; if(r===5&&k===4) ww=gw*5.84; g.fillRect(kx0+k*gw+gw*0.08, ky0+r*gh+gh*0.1, ww, r===0?gh*0.55:gh*0.8); }
  g.fillStyle=P.pad; var tw=pw*0.34, th=ph*0.3; g.fillRect((pw-tw)/2,ph*0.6,tw,th);
  return canvasTex(c);
}
function keyboardTexture(v,color){
  var pw=1024, ph=Math.round(pw*v.d/v.w); var c=document.createElement("canvas"); c.width=pw; c.height=ph; var g=c.getContext("2d");
  var light=lum(color)>0.6, keyCol=light?"#fbfbf8":mix(color,"#ffffff",0.1), keyEdge=light?"#cfcfca":mix(color,"#000000",0.35);
  g.fillStyle=color; g.fillRect(0,0,pw,ph);
  var hasF=v.id!=="60", hU=hasF?6.25:5, u=Math.min(pw*0.955/v.units, ph*0.9/hU), ox=(pw-v.units*u)/2, oy=(ph-hU*u)/2;
  function key(xu,yu,wu,hu){ var x=ox+xu*u+u*0.05, y=oy+yu*u+u*0.05, w=wu*u-u*0.1, h=(hu||1)*u-u*0.1;
    g.fillStyle=keyEdge; roundRect(g,x,y,w,h,u*0.12); g.fill(); g.fillStyle=keyCol; roundRect(g,x+u*0.06,y+u*0.04,w-u*0.12,h-u*0.14,u*0.1); g.fill(); }
  function row(seq,y,x0){ var x=x0||0; seq.forEach(function(w){ if(w<0) x+=-w; else { key(x,y,w); x+=w; } }); }
  var y0=hasF?1.25:0;
  if(hasF) row([1,-1,1,1,1,1,-0.5,1,1,1,1,-0.5,1,1,1,1],0);
  row([1,1,1,1,1,1,1,1,1,1,1,1,1,2],y0); row([1.5,1,1,1,1,1,1,1,1,1,1,1,1,1.5],y0+1);
  row([1.75,1,1,1,1,1,1,1,1,1,1,1,2.25],y0+2); row([2.25,1,1,1,1,1,1,1,1,1,1,2.75],y0+3); row([1.25,1.25,1.25,6.25,1.25,1.25,1.25,1.25],y0+4);
  if(v.id==="75") for(var r=0;r<6;r++) key(15.25, r===0?0:1.25+(r-1), 1);
  if(v.id==="tkl"||v.id==="full"){ var nx=15.25; row([1,1,1],0,nx); row([1,1,1],1.25,nx); row([1,1,1],2.25,nx); key(nx+1,4.25,1); row([1,1,1],5.25,nx); }
  if(v.id==="full"){ var px=18.5; row([1,1,1,1],1.25,px); row([1,1,1],2.25,px); key(px+3,2.25,1,2); row([1,1,1],3.25,px); row([1,1,1],4.25,px); key(px+3,4.25,1,2); row([2,1],5.25,px); }
  return canvasTex(c);
}

/* ================= models (y=0 on surface; front faces +z) ================= */
function edgeMounted(it){return (it.kind==="monitor"&&it.mount==="arm")||(it.kind==="headphones"&&it.variant==="hook")||(it.kind==="micArm"&&it.variant!=="floor");}
function clampAnchor(it){return it.kind==="monitor"?{x:0,z:-(clamp(0.5+it.diagonal*0.012,0.6,1.3)/2+6)}:{x:0,z:0};}
function addDeskClamp(g,m,z){
  var c=new THREE.Group();c.position.z=z||0;
  var top=box(2.6,0.35,2.8,m);top.position.set(0,0.175,1.4);c.add(top);
  var spine=box(2.6,DESK_TOP+0.7,0.4,m);spine.position.set(0,-DESK_TOP/2,-0.25);c.add(spine);
  var bottom=box(2.6,0.35,2.8,m);bottom.position.set(0,-DESK_TOP-0.225,1.4);c.add(bottom);
  var screw=cyl(0.18,0.18,0.9,m,10);screw.position.set(0,-DESK_TOP-0.8,1.7);c.add(screw);
  g.add(c);
}
// Cylindrical face: measured width is the visible arc length, with a fixed gentle curve.
function curvedPanelGeometry(w,h,depth,radius){
  var geo=new THREE.BoxGeometry(w,h,depth,48,1,1),a=geo.attributes.position;
  for(var i=0;i<a.count;i++){var x=a.getX(i),z=a.getZ(i),ang=x/radius;a.setXYZ(i,radius*Math.sin(ang),a.getY(i),z+radius*(1-Math.cos(ang)));}
  a.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();return geo;
}
function curvedFaceGeometry(w,h,radius){
  var geo=new THREE.PlaneGeometry(w,h,48,1),a=geo.attributes.position;
  for(var i=0;i<a.count;i++){var ang=a.getX(i)/radius;a.setXYZ(i,radius*Math.sin(ang),a.getY(i),radius*(1-Math.cos(ang)));}
  a.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();return geo;
}
function monitorDefaultLift(it){ var D=it.diagonal; return clamp(2.2+D*0.09,3.5,7.5); }
function buildMonitor(it){
  var d=screenDims(it), W=d.w, H=d.h, D=it.diagonal, g=new THREE.Group();
  var bezel=clamp(D*0.012,0.25,0.6), chin=bezel*1.6, pW=W+bezel*2, pH=H+bezel+chin, pT=clamp(0.5+D*0.012,0.6,1.3);
  var black=mat(P.bezel,0.6,0.1), metal=mat(P.stand,0.45,0.55);
  var lift=isNum(it.lift)?it.lift:monitorDefaultLift(it);
  var cy=lift+pH/2;
  if(it.mount==="arm"){
    var poleZ=-(pT/2+6), poleH=cy+4;
    addDeskClamp(g,metal,poleZ);
    var pole=cyl(0.55,0.55,poleH,metal); pole.position.set(0,poleH/2,poleZ); g.add(pole);
    g.add(rod(V(0,cy+2,poleZ),V(0,cy,-(pT/2+1.2)),0.5,metal));
    var joint=cyl(0.7,0.7,1.2,metal); joint.position.set(0,cy+2,poleZ); g.add(joint);
    var vesa=box(4,4,0.6,metal); vesa.position.set(0,cy,-(pT/2+0.3)); g.add(vesa);
  } else {
    var baseW=clamp(Math.max(W,H)*0.3,7,17), baseD=clamp(D*0.27,6.5,11), baseT=clamp(D*0.012,0.35,0.7);
    var neckW=clamp(D*0.085,1.8,3.8), neckT=clamp(D*0.03,0.7,1.4), neckZ=-(pT/2+neckT/2+0.25), neckH=cy-baseT+2;
    var base=box(baseW,baseT,baseD,metal); base.position.set(0,baseT/2,neckZ+baseD*0.28); g.add(base);
    var neck=box(neckW,neckH,neckT,metal); neck.position.set(0,baseT+neckH/2,neckZ); g.add(neck);
  }
  var bulge=box(pW*0.5,pH*0.5,pT*0.9,mat(P.bulge,0.7,0.05)); bulge.position.set(0,cy,-pT*0.7); g.add(bulge);
  var curveR=Math.max(W*1.3,40),panel=it.curved?new THREE.Mesh(curvedPanelGeometry(pW,pH,pT,curveR),black):box(pW,pH,pT,black);panel.castShadow=true;panel.receiveShadow=true;panel.position.set(0,cy,0);g.add(panel);
  var glass=new THREE.Mesh(it.curved?curvedFaceGeometry(W,H,curveR):new THREE.PlaneGeometry(W,H), new THREE.MeshBasicMaterial({ map:screenTexture(it,W,H), toneMapped:false }));
  glass.position.set(0,lift+chin+H/2,pT/2+0.01); g.add(glass);
  return g;
}
function buildLaptop(it){
  var d=screenDims(it), W=d.w, H=d.h, D=it.diagonal, g=new THREE.Group();
  var bezel=clamp(D*0.022,0.25,0.45), bodyW=W+bezel*2+0.2, lidH=H+bezel*2.4, baseD=lidH*0.97, baseT=clamp(D*0.04,0.5,0.9), lidT=0.22;
  var alu=mat(P.alu,0.35,0.7);
  var body=new THREE.Group(); g.add(body);
  var top=new THREE.MeshStandardMaterial({ map:laptopDeckTexture(bodyW,baseD), roughness:0.5, metalness:0.3 });
  var base=box(bodyW,baseT,baseD,[alu,alu,top,alu,alu,alu]); base.position.set(0,baseT/2,baseD*0.05); body.add(base);
  var hinge=new THREE.Group(); hinge.position.set(0,baseT,-baseD*0.45+0.1); hinge.rotation.x=-0.3; body.add(hinge);
  var lid=box(bodyW,lidH,lidT,[alu,alu,alu,alu,mat(P.lid,0.6,0.1),alu]); lid.position.set(0,lidH/2,-lidT/2); hinge.add(lid);
  var glass=new THREE.Mesh(it.curved?curvedFaceGeometry(W,H,curveR):new THREE.PlaneGeometry(W,H), new THREE.MeshBasicMaterial({ map:screenTexture(it,W,H), toneMapped:false }));
  glass.position.set(0,bezel*1.4+H/2,0.012); hinge.add(glass);
  if(it.stand){
    var tilt=0.26, rise=2.2, sm=mat(P.dark?0x8c9096:0xc3c6cb,0.35,0.7);
    var plate=box(bodyW*0.8,0.18,baseD*0.95,sm); plate.position.set(0,rise+0.09,0); plate.rotation.x=tilt; g.add(plate);
    [-1,1].forEach(function(s){
      var x=s*bodyW*0.3;
      g.add(rod(V(x,0.2,baseD*0.42),V(x,rise+Math.sin(tilt)*baseD*0.4-0.1,-baseD*0.38),0.28,sm));
      g.add(rod(V(x,0.2,-baseD*0.42),V(x,rise-0.2,baseD*0.2),0.28,sm));
      var foot=box(1.4,0.25,baseD*0.9,sm); foot.position.set(x,0.12,0); g.add(foot);
    });
    body.position.y=rise+0.2; body.rotation.x=tilt;
  } else { body.position.y=0.1; }
  return g;
}
function buildKeyboard(it){
  var v=variantOf(it), g=new THREE.Group(), side=mat(it.color,0.55,0.1), top=new THREE.MeshStandardMaterial({ map:keyboardTexture(v,it.color), roughness:0.55 });
  var b=box(v.w,v.h*0.75,v.d,[side,side,top,side,side,side]); b.position.y=v.h*0.42; b.rotation.x=0.05; g.add(b); return g;
}
function buildMouse(it){
  var v=variantOf(it), g=new THREE.Group(), m=mat(it.color,0.42,0.1);
  var shell=new THREE.Mesh(new THREE.SphereGeometry(1,36,18,0,Math.PI*2,0,Math.PI/2),m); shell.castShadow=true; shell.scale.set(v.w/2,v.h,v.d/2);
  if(v.id==="vertical"){ shell.rotation.z=-0.28; shell.position.y=-0.15; }
  g.add(shell);
  var plate=cyl(1,1,0.1,mat(0x111111,0.8),36); plate.scale.set(v.w/2*0.98,1,v.d/2*0.98); plate.position.y=0.05; g.add(plate);
  if(v.id!=="vertical"){ var wheel=cyl(0.2,0.2,0.16,mat(0x333333,0.5),14); wheel.rotation.z=Math.PI/2; wheel.position.set(0,v.h*0.86,-v.d*0.22); g.add(wheel); }
  return g;
}
function buildMousepad(it){
  var v=variantOf(it), g=new THREE.Group(), top=mat(it.color,0.95), edge=mat(mix(it.color,"#000000",0.3),0.8);
  var p=box(v.w,0.12,v.d,[edge,edge,top,edge,edge,edge]); p.position.y=0.06; p.castShadow=false; g.add(p); return g;
}
function buildChair(it){
  var v=chairSpec(it), g=new THREE.Group();
  var fabric=mat(it.color,0.85), frame=mat(0x1b1c1f,0.45,0.5), chrome=mat(0x9aa0a6,0.3,0.9);
  var trim=mat(lum(it.color)>0.5?0x2a2b2f:mix(it.color,"#ffffff",0.25),0.8);
  var hub=cyl(1.6,1.8,1.4,frame); hub.position.y=3; g.add(hub);
  for(var i=0;i<5;i++){
    var a=i*Math.PI*2/5+Math.PI/10;
    var leg=box(v.legR,1,1.6,frame); leg.position.set(Math.cos(a)*v.legR/2,2.6,Math.sin(a)*v.legR/2); leg.rotation.y=-a; g.add(leg);
    var caster=new THREE.Mesh(new THREE.SphereGeometry(1.05,12,8),frame); caster.castShadow=true; caster.position.set(Math.cos(a)*(v.legR-0.4),1.05,Math.sin(a)*(v.legR-0.4)); g.add(caster);
  }
  var seatT=3, gasH=Math.max(3, v.seatH-seatT-4.2);
  var gas=cyl(0.9,0.9,gasH,chrome,16); gas.position.y=3.6+gasH/2; g.add(gas);
  var mech=box(8,1.2,8,frame); mech.position.y=v.seatH-seatT-0.5; g.add(mech);
  var seat=box(v.seatW,seatT,v.seatD,fabric); seat.position.y=v.seatH-seatT/2; g.add(seat);
  var backZ=v.seatD/2+0.8;
  var spine=box(2.5,8,1.2,frame); spine.position.set(0,v.seatH+1,backZ); g.add(spine);
  var back=new THREE.Group(); back.position.set(0,v.seatH+2,backZ-0.3); back.rotation.x=0.13; g.add(back);
  var bMat=fabric;
  if(v.id==="ergo") bMat=new THREE.MeshStandardMaterial({ color:lin(it.color), roughness:0.9, transparent:true, opacity:0.62, depthWrite:false });
  var br=box(v.backW,v.backH,v.id==="ergo"?1:3,bMat); br.position.y=v.backH/2; back.add(br);
  if(v.id==="ergo"){
    [-1,1].forEach(function(s){ var f=box(1,v.backH,1.4,frame); f.position.set(s*v.backW/2,v.backH/2,0); back.add(f); });
    var tb=box(v.backW+1,1,1.4,frame); tb.position.set(0,v.backH,0); back.add(tb);
    var hs=box(1.2,3,0.8,frame); hs.position.set(0,v.backH+1.8,0); back.add(hs);
    var hr=box(v.backW*0.55,4.5,1.6,fabric); hr.position.set(0,v.backH+4.8,-0.2); back.add(hr);
  }
  if(v.wings){
    [-1,1].forEach(function(s){ var w=box(3,v.backH*0.8,4,fabric); w.position.set(s*(v.backW/2-1),v.backH*0.45,-1.4); back.add(w);
      var st=box(0.5,v.backH*0.7,4.1,trim); st.position.set(s*(v.backW/2-2.6),v.backH*0.45,-1.4); back.add(st); });
    var pillow=box(9,3.5,2.6,trim); pillow.position.set(0,v.backH*0.86,-2.6); back.add(pillow);
    var lumbar=box(11,4,2.4,trim); lumbar.position.set(0,v.backH*0.2,-2.6); back.add(lumbar);
  }
  if(v.arms){
    [-1,1].forEach(function(s){ var x=s*(v.seatW/2+0.9);
      var post=box(1.2,7.5,1.8,frame); post.position.set(x,v.seatH+2.8,1.5); g.add(post);
      var pad=box(3,1.1,10,frame); pad.position.set(x,v.seatH+7,0.3); g.add(pad); });
  }
  return g;
}
function buildPC(it){
  var v=variantOf(it), W=v.w*CM, H=v.h*CM, D=v.d*CM, g=new THREE.Group(), ft=0.5, tk=0.18;
  var body=mat(it.color,0.45,0.35), inner=mat(0x0f1012,0.8), feet=mat(0x111111,0.9);
  var glassM=new THREE.MeshStandardMaterial({ color:lin(0x1c2533), transparent:true, opacity:0.32, roughness:0.05, metalness:0.2, depthWrite:false });
  var y0=ft;
  var top=box(W,tk,D,body); top.position.set(0,y0+H-tk/2,0); g.add(top);
  var bot=box(W,tk,D,body); bot.position.set(0,y0+tk/2,0); g.add(bot);
  var right=box(tk,H,D,body); right.position.set(W/2-tk/2,y0+H/2,0); g.add(right);
  var backP=box(W,H,tk,body); backP.position.set(0,y0+H/2,-D/2+tk/2); g.add(backP);
  var front=box(W,H,tk*2,body); front.position.set(0,y0+H/2,D/2-tk); g.add(front);
  var glass=box(0.08,H-0.2,D-0.2,glassM); glass.position.set(-W/2+0.04,y0+H/2,0); glass.castShadow=false; g.add(glass);
  var mb=box(0.12,H*0.62,D*0.58,mat(0x1d2a24,0.7)); mb.position.set(W/2-tk-0.1,y0+H*0.58,-D*0.12); g.add(mb);
  var shroud=box(W-tk*2,H*0.22,D-tk*3,mat(mix(it.color,"#000000",0.25),0.6)); shroud.position.set(0,y0+tk+H*0.11,0); g.add(shroud);
  var gpu=box(W*0.52,1.7,D*0.62,mat(0x2b2d31,0.5,0.4)); gpu.position.set(W/2-tk-W*0.28,y0+H*0.42,-D*0.05); g.add(gpu);
  var cooler=cyl(1.2,1.2,W*0.4,mat(0x3a3c40,0.5,0.5),16); cooler.rotation.z=Math.PI/2; cooler.position.set(W/2-tk-W*0.22,y0+H*0.72,-D*0.12); g.add(cooler);
  var rgbOn=!!it.rgb, rc=it.rgbColor||"#35d3ff";
  var fanMat=rgbOn?glow(rc):mat(0x3a3c40,0.6), hubMat=mat(0x1a1b1d,0.7);
  var n=v.fans, slot=(H*0.62)/n, R=Math.min(W*0.38, slot*0.44);
  for(var i=0;i<n;i++){
    var fy=y0+H*0.3+(i+0.5)*slot;
    var ring=new THREE.Mesh(new THREE.TorusGeometry(R,0.14,8,32),fanMat); ring.position.set(0,fy,D/2-tk*2-0.5); g.add(ring);
    var hub=cyl(R*0.3,R*0.3,0.3,hubMat,16); hub.rotation.x=Math.PI/2; hub.position.set(0,fy,D/2-tk*2-0.6); g.add(hub);
    for(var b=0;b<5;b++){ var bl=box(R*0.65,R*0.2,0.06,hubMat); var an=b*Math.PI*2/5; bl.position.set(Math.cos(an)*R*0.5,fy+Math.sin(an)*R*0.5,D/2-tk*2-0.62); bl.rotation.z=an+0.4; g.add(bl); }
  }
  var rearRing=new THREE.Mesh(new THREE.TorusGeometry(R*0.9,0.12,8,28),fanMat); rearRing.position.set(0,y0+H*0.78,-D/2+tk+0.4); g.add(rearRing);
  var strip=box(0.25,H*0.72,0.06,rgbOn?glow(rc):mat(mix(it.color,"#000000",0.4),0.5)); strip.position.set(W*0.3,y0+H*0.5,D/2+0.02); strip.castShadow=false; g.add(strip);
  var pwr=cyl(0.35,0.35,0.1,rgbOn?glow("#ffffff"):mat(0x666666,0.5),16); pwr.rotation.x=Math.PI/2; pwr.position.set(-W*0.22,y0+H-1.2,D/2+0.02); g.add(pwr);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){ var f=box(1.2,ft,1.6,feet); f.position.set(p[0]*(W/2-1),ft/2,p[1]*(D/2-1.4)); g.add(f); });
  return g;
}
function buildRiser(it){
  var v=variantOf(it), W=v.w*CM, D=v.d*CM, H=v.h*CM, g=new THREE.Group();
  var wood=it.color==="#a87b50";
  var m=wood?new THREE.MeshStandardMaterial({ map:deskTexture(DESK_COLORS[0]), roughness:0.7 }):mat(it.color,0.6,0.1);
  var legM=mat(wood?0x2e2f33:mix(it.color,"#000000",0.15),0.5,0.3);
  var top=box(W,0.7,D,m); top.position.y=H-0.35; g.add(top);
  [-1,1].forEach(function(s){ var leg=box(0.7,H-0.7,D*0.92,legM); leg.position.set(s*(W/2-1.2),(H-0.7)/2,0); g.add(leg); });
  return g;
}
function micHead(color, r, len){
  var g=new THREE.Group(), body=mat(color,0.4,0.4), grille=mat(mix(color,"#000000",0.35),0.9,0.2);
  var c=cyl(r,r,len*0.55,body,24); c.position.y=len*0.275; g.add(c);
  var gr=cyl(r*0.98,r*0.98,len*0.45,grille,24); gr.position.y=len*0.55+len*0.225; g.add(gr);
  var dome=new THREE.Mesh(new THREE.SphereGeometry(r*0.98,24,12,0,Math.PI*2,0,Math.PI/2),grille); dome.position.y=len; dome.castShadow=true; g.add(dome);
  return g;
}
function buildMic(it){
  var v=variantOf(it), g=new THREE.Group(), tall=v.tall*CM, baseR=v.base*CM/2, r=v.r*CM;
  var m=mat(it.color,0.4,0.45);
  var base=cyl(baseR,baseR*1.05,0.5,m,28); base.position.y=0.25; g.add(base);
  var yokeH=tall*0.45;
  [-1,1].forEach(function(s){ var y=box(0.35,yokeH,0.9,m); y.position.set(s*(r+0.35),0.5+yokeH/2,0); g.add(y); });
  var stem=cyl(0.3,0.3,yokeH*0.5,m,12); stem.position.y=0.5+yokeH*0.25; g.add(stem);
  var head=micHead(it.color,r,tall-0.5-yokeH*0.35); head.position.y=0.5+yokeH*0.35; head.rotation.x=-0.08; g.add(head);
  return g;
}
function buildMicArm(it){
  var v=variantOf(it), g=new THREE.Group(), m=mat(it.color,0.45,0.5), dark=mat(0x151618,0.6,0.3);
  if(v.id==="floor"){
    var T=v.tall*CM, hub=V(0,9,0);
    for(var i=0;i<3;i++){ var a=i*Math.PI*2/3+Math.PI/2; g.add(rod(hub,V(Math.cos(a)*11,0.3,Math.sin(a)*11),0.35,m)); }
    var poleTop=V(0,T*0.62,0); g.add(rod(V(0,8,0),poleTop,0.45,m));
    var boomEnd=V(0,T*0.72,-20); g.add(rod(V(0,T*0.6,6),boomEnd,0.3,m));
    var knob=cyl(0.8,0.8,1.4,dark,14); knob.rotation.x=Math.PI/2; knob.position.copy(poleTop); g.add(knob);
    var head=micHead(it.color==="#1f2023"?"#2a2b2f":it.color,1.1,5); head.position.set(0,T*0.72-5.8,-20); g.add(head);
    return g;
  }
  addDeskClamp(g,m,0);
  var p0=V(0,1,0), p1=V(0,9,0), p2=V(0,21,9), p3=V(0,18,22);
  g.add(rod(p0,p1,0.45,m)); g.add(rod(p1,p2,0.35,m)); g.add(rod(V(0.7,9.5,0.3),V(0.7,21.3,9.2),0.12,dark)); g.add(rod(p2,p3,0.32,m));
  [p1,p2].forEach(function(p){ var j=cyl(0.8,0.8,1.6,dark,14); j.rotation.z=Math.PI/2; j.position.copy(p); g.add(j); });
  var mount=new THREE.Mesh(new THREE.TorusGeometry(1.6,0.12,6,24),dark); mount.position.set(0,p3.y-2.4,p3.z); g.add(mount);
  var head=micHead(it.color==="#1f2023"?"#2a2b2f":it.color,1.15,5.5); head.position.set(0,p3.y-6.2,p3.z); g.add(head);
  g.add(rod(p3,V(0,p3.y-2.4,p3.z),0.25,dark));
  return g;
}
function rng(seed){ var a=(seed*2654435761)>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; var t2=a; t2=Math.imul(t2^(t2>>>15),t2|1); t2^=t2+Math.imul(t2^(t2>>>7),t2|61); return ((t2^(t2>>>14))>>>0)/4294967296; }; }
function headphoneSet(color, cupScale){
  var g=new THREE.Group(), R=3.5, m=mat(color,0.45,0.25), pad=mat(mix(color,"#000000",0.45),0.95), band=mat(mix(color,"#000000",0.2),0.6,0.2);
  var arc=new THREE.Mesh(new THREE.TorusGeometry(R,0.28,8,36,Math.PI),band); arc.castShadow=true; g.add(arc);
  var cushion=new THREE.Mesh(new THREE.TorusGeometry(R-0.25,0.42,8,24,Math.PI*0.7),pad); cushion.rotation.z=Math.PI*0.15; cushion.position.y=-0.05; g.add(cushion);
  [-1,1].forEach(function(s){
    var yoke=box(0.25,1.6,0.9,band); yoke.position.set(s*R,-0.7,0); g.add(yoke);
    var cup=cyl(1.75*cupScale,1.75*cupScale,1.1,m,28); cup.rotation.z=Math.PI/2; cup.position.set(s*(R-0.1),-1.9,0); g.add(cup);
    var cush=cyl(1.6*cupScale,1.6*cupScale,0.5,pad,24); cush.rotation.z=Math.PI/2; cush.position.set(s*(R-0.85),-1.9,0); g.add(cush);
  });
  return g;
}
function buildHeadphones(it){
  var v=variantOf(it), g=new THREE.Group();
  if(v.id==="stand"){
    var sm=mat(P.dark?0x3a3c40:0x2e2f33,0.4,0.6), H=10.2;
    var base=cyl(2.4,2.5,0.45,sm,28); base.position.y=0.22; g.add(base);
    var pole=cyl(0.35,0.4,H,sm,14); pole.position.y=H/2+0.4; g.add(pole);
    var saddle=box(1.2,0.5,2.6,mat(0x151618,0.9)); saddle.position.y=H+0.6; g.add(saddle);
    var hp=headphoneSet(it.color,1); hp.position.y=H+0.85-3.5; g.add(hp);
    return g;
  }
  if(v.id==="flat"){
    var hp2=headphoneSet(it.color,1); hp2.rotation.x=-Math.PI/2; hp2.position.set(0,1.95,1.5); g.add(hp2);
    return g;
  }
  var hm=mat(P.dark?0x3a3c40:0x2e2f33,0.4,0.6), y0=-DESK_TOP;
  addDeskClamp(g,hm,0);
  var arm=box(0.6,0.5,4.4,hm);arm.position.set(0,y0-0.7,-1.6);g.add(arm);
  var lip=box(0.6,1.1,0.5,hm);lip.position.set(0,y0-0.8,-3.7);g.add(lip);
  var hp3=headphoneSet(it.color,1);hp3.position.set(0,y0-1.0-3.5,-3.0);g.add(hp3);
  return g;
}
function pot(g,color,rt,rb,h){
  var m=mat(color,0.8), soil=mat(0x3a2a1e,1);
  var p=cyl(rt,rb,h,m,28); p.position.y=h/2; g.add(p);
  var rim=cyl(rt+0.12,rt+0.12,Math.min(0.6,h*0.12),m,28); rim.position.y=h-Math.min(0.3,h*0.06); g.add(rim);
  var s=cyl(rt-0.15,rt-0.15,0.1,soil,24); s.position.y=h-0.25; s.castShadow=false; g.add(s);
  return h-0.2;
}
function leaf(parent,len,wid,col,yaw,pitch,x,y,z){
  var piv=new THREE.Group(); piv.position.set(x,y,z); piv.rotation.set(0,yaw,0); parent.add(piv);
  var tilt=new THREE.Group(); tilt.rotation.x=pitch; piv.add(tilt);
  var l=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),col); l.scale.set(wid,Math.max(0.06,wid*0.08),len); l.position.z=len*0.95; l.castShadow=true; tilt.add(l);
  return piv;
}
function buildPlant(it){
  var outer=new THREE.Group(), g=buildPlantModel(it); g.scale.setScalar(plantScale(it)); outer.add(g); return outer;
}
function buildCustom(it){
  var g=new THREE.Group(), W=clamp(+it.w||30,1,300)*CM, D=clamp(+it.d||20,1,200)*CM, H=clamp(+it.h||15,0.5,300)*CM;
  var m=new THREE.MeshStandardMaterial({ color:lin(it.color||"#8a8e95"), roughness:0.55, metalness:0.05 });
  var body=box(W,H,D,m); body.position.y=H/2; g.add(body);
  var edges=new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color:lin(mix(it.color||"#8a8e95", lum(it.color||"#8a8e95")>0.5?"#000000":"#ffffff",0.35)), transparent:true, opacity:0.55 }));
  edges.position.copy(body.position); g.add(edges);
  return g;
}
function buildPlantModel(it){
  var v=variantOf(it), g=new THREE.Group(), r=rng(it.id||7);
  var greens=[mat(0x3f7a4a,0.7),mat(0x4f8f55,0.7),mat(0x2f6a3e,0.7)];
  function G(){ return greens[Math.floor(r()*greens.length)]; }
  if(v.id==="cactus"){
    var top=pot(g,it.color,1.9,1.5,3);
    var body=cyl(0.95,1.05,4.2,greens[0],16); body.position.y=top+2.1; g.add(body);
    var cap=new THREE.Mesh(new THREE.SphereGeometry(0.95,16,10),greens[0]); cap.position.y=top+4.2; cap.castShadow=true; g.add(cap);
    [-1,1].forEach(function(s,i){ var h0=top+1.6+i*0.9; g.add(rod(V(s*0.7,h0,0),V(s*1.7,h0+0.4,0),0.42,greens[1])); var up=cyl(0.42,0.42,1.6,greens[1],12); up.position.set(s*1.75,h0+1.1,0); g.add(up);
      var c2=new THREE.Mesh(new THREE.SphereGeometry(0.42,10,8),greens[1]); c2.position.set(s*1.75,h0+1.9,0); g.add(c2); });
    return g;
  }
  if(v.id==="leafy"){
    var t2=pot(g,it.color,2.7,2.1,4.4);
    for(var i=0;i<16;i++){ var yaw=r()*Math.PI*2, len=2.2+r()*1.6; g.add(rod(V(0,t2,0),V(Math.sin(yaw)*0.6,t2+3+r()*3,Math.cos(yaw)*0.6),0.07,greens[2]));
      leaf(g,len,0.9+r()*0.35,G(),yaw,-(0.5+r()*0.7),Math.sin(yaw)*0.5,t2+2.8+r()*3.2,Math.cos(yaw)*0.5); }
    return g;
  }
  if(v.id==="trailing"){
    var t3=pot(g,it.color,2.5,2.0,3.6);
    for(var k=0;k<7;k++){ var yw=k*Math.PI*2/7+r()*0.4; leaf(g,1.1,0.8,G(),yw,-0.35,Math.sin(yw)*0.6,t3+0.5,Math.cos(yw)*0.6); }
    for(var vi=0;vi<5;vi++){
      var ang=vi*Math.PI*2/5+r()*0.5, dx=Math.sin(ang), dz=Math.cos(ang), px=dx*2.4, pz=dz*2.4, py=t3+0.2;
      for(var j=0;j<6;j++){ px+=dx*(0.55+r()*0.2); pz+=dz*(0.55+r()*0.2); py=Math.max(0.3, py-(j<2?0.6:0.9)); if(Math.hypot(px,pz)<2.6){ px=dx*2.7; pz=dz*2.7; }
        leaf(g,0.8,0.6,G(),ang+(r()-0.5)*1.2,0.3-r()*0.6,px,py,pz); }
    }
    return g;
  }
  var t4=pot(g,it.color,6.2,5.0,12.5);
  for(var s2=0;s2<9;s2++){
    var yw2=s2*Math.PI*2/9+r()*0.5, h2=t4+14+r()*22, lean=3+r()*5;
    var end=V(Math.sin(yw2)*lean,h2,Math.cos(yw2)*lean);
    g.add(rod(V(Math.sin(yw2)*0.8,t4,Math.cos(yw2)*0.8),end,0.18,greens[2]));
    leaf(g,5+r()*2.5,3.2+r()*1.2,G(),yw2,-(0.25+r()*0.5),end.x,end.y,end.z);
  }
  return g;
}
function buildItem(it){
  switch(it.kind){
    case "monitor": return buildMonitor(it); case "laptop": return buildLaptop(it);
    case "keyboard": return buildKeyboard(it); case "mouse": return buildMouse(it);
    case "mousepad": return buildMousepad(it); case "pc": return buildPC(it);
    case "riser": return buildRiser(it); case "mic": return buildMic(it);
    case "micArm": return buildMicArm(it); case "headphones": return buildHeadphones(it);
    case "plant": return buildPlant(it); case "custom": return buildCustom(it); default: return buildChair(it);
  }
}

/* ================= desk geometry ================= */
function deskRects(){
  var hw=DESK_W/2, hd=DESK_D/2, rects=[{ x0:-hw, x1:hw, z0:-hd, z1:hd }];
  if(desk.shape==="lRight"||desk.shape==="lLeft"){
    var rd=Math.min(desk.rd*CM, DESK_W-8), rl=desk.rl*CM;
    if(desk.shape==="lRight") rects.push({ x0:hw-rd, x1:hw, z0:-hd, z1:-hd+rl });
    else rects.push({ x0:-hw, x1:-hw+rd, z0:-hd, z1:-hd+rl });
  }
  return rects;
}
function mountEdges(){
  var rs=deskRects(),xs=[],zs=[],result=[],seen={};
  rs.forEach(function(r){xs.push(r.x0,r.x1);zs.push(r.z0,r.z1);});
  function add(axis,fixed,lo,hi,nx,nz){
    var cuts=[lo,hi].concat((axis==="x"?xs:zs).filter(function(v){return v>lo&&v<hi;})).sort(function(a,b){return a-b;});
    for(var i=0;i<cuts.length-1;i++){
      var a=cuts[i],b=cuts[i+1],mid=(a+b)/2,x=axis==="x"?mid:fixed,z=axis==="x"?fixed:mid;
      if(b-a<0.01||!pointOnDesk(x+nx*0.05,z+nz*0.05)||pointOnDesk(x-nx*0.05,z-nz*0.05))continue;
      var key=[axis,fixed,a,b,nx,nz].join('/');if(seen[key])continue;seen[key]=true;
      result.push({axis:axis,fixed:fixed,lo:a,hi:b,nx:nx,nz:nz,side:nx>0?'left':nx<0?'right':nz>0?'back':'front'});
    }
  }
  rs.forEach(function(r){add('x',r.z0,r.x0,r.x1,0,1);add('x',r.z1,r.x0,r.x1,0,-1);add('z',r.x0,r.z0,r.z1,1,0);add('z',r.x1,r.z0,r.z1,-1,0);});
  var merged=[];
  result.sort(function(a,b){return a.side.localeCompare(b.side)||a.fixed-b.fixed||a.lo-b.lo;}).forEach(function(edge){
    var previous=merged[merged.length-1];
    if(previous&&previous.side===edge.side&&previous.fixed===edge.fixed&&Math.abs(previous.hi-edge.lo)<0.001)previous.hi=edge.hi;
    else merged.push(edge);
  });
  return merged;
}
function snapClamp(e){
  var it=e.it,a=clampAnchor(it),rot=it.rot||0,px=(it.x||0)+a.x*Math.cos(rot)+a.z*Math.sin(rot),pz=(it.z||0)-a.x*Math.sin(rot)+a.z*Math.cos(rot);
  var edges=mountEdges(),candidates=edges.filter(function(edge){return !it.mountSide||it.mountSide==='auto'||edge.side===it.mountSide;});
  if(!candidates.length)candidates=edges;
  var best=null;
  candidates.forEach(function(edge){
    var pad=Math.min(4.6,(edge.hi-edge.lo)/2),v=clamp(edge.axis==='x'?px:pz,edge.lo+pad,edge.hi-pad);
    var x=edge.axis==='x'?v:edge.fixed,z=edge.axis==='x'?edge.fixed:v,cost=Math.hypot(x-px,z-pz);
    if(!best||cost<best.cost)best={x:x,z:z,cost:cost,edge:edge};
  });
  if(!best)return;
  it.rot=Math.atan2(best.edge.nx,best.edge.nz);
  it.x=best.x-a.x*Math.cos(it.rot)-a.z*Math.sin(it.rot);it.z=best.z+a.x*Math.sin(it.rot)-a.z*Math.cos(it.rot);
  e.lift=0;applyTransform(e);
}
function deskBounds(){ var r=deskRects(), b={ x0:1e9,x1:-1e9,z0:1e9,z1:-1e9 }; r.forEach(function(q){ b.x0=Math.min(b.x0,q.x0); b.x1=Math.max(b.x1,q.x1); b.z0=Math.min(b.z0,q.z0); b.z1=Math.max(b.z1,q.z1); }); return b; }
function pointOnDesk(x,z,tol){ var t0=tol||0; return deskRects().some(function(r){ return x>=r.x0-t0 && x<=r.x1+t0 && z>=r.z0-t0 && z<=r.z1+t0; }); }
function boxOnDesk(b,tol){
  for(var i=0;i<=4;i++) for(var j=0;j<=4;j++){
    var x=b.min.x+(b.max.x-b.min.x)*i/4, z=b.min.z+(b.max.z-b.min.z)*j/4;
    if(!pointOnDesk(x,z,tol==null?0.3:tol)) return false;
  }
  return true;
}
function deskEnds(){
  var rects=deskRects(), m=rects[0], ends=[], inset=2.5;
  if(!rects[1]){ ends.push({ x:m.x0+inset, z:0, rot:0, len:DESK_D }); ends.push({ x:m.x1-inset, z:0, rot:0, len:DESK_D }); return ends; }
  var w=rects[1], right=desk.shape==="lRight";
  ends.push({ x:right?m.x0+inset:m.x1-inset, z:0, rot:0, len:DESK_D });
  ends.push({ x:right?m.x1-inset:m.x0+inset, z:0, rot:0, len:DESK_D });
  ends.push({ x:(w.x0+w.x1)/2, z:w.z1-inset, rot:Math.PI/2, len:w.x1-w.x0 });
  return ends;
}
function legFrame(style,len,legM,footM){
  var g=new THREE.Group(), H=DESK_H-DESK_TOP, top=-DESK_TOP, s=len/2-2.5;
  if(style==="tframe"){
    var col=box(2.6,H-1.6,3.4,legM); col.position.set(0,top-1.1-(H-1.6)/2,0); g.add(col);
    var foot=box(2.6,1.2,len-5,legM); foot.position.set(0,top-H+0.6,0); g.add(foot);
    var arm=box(1.6,1.1,len-7,legM); arm.position.set(0,top-0.55,0); g.add(arm);
    [-1,1].forEach(function(k){ var p=box(2.8,0.3,1.3,footM); p.position.set(0,top-H+0.15,k*(len/2-3)); g.add(p); });
  } else if(style==="sled"){
    [-1,1].forEach(function(k){ var p=box(1.4,H,1.4,legM); p.position.set(0,top-H/2,k*s); g.add(p); });
    var b=box(1.4,1.4,2*s,legM); b.position.set(0,top-H+0.7,0); g.add(b);
    var tb=box(1.4,1.2,2*s,legM); tb.position.set(0,top-0.6,0); g.add(tb);
  } else if(style==="x"){
    g.add(rod(V(0,top-0.6,-s),V(0,top-H+0.7,s),0.75,legM)); g.add(rod(V(0,top-0.6,s),V(0,top-H+0.7,-s),0.75,legM));
    [-1,1].forEach(function(k){ var f=box(1.9,1,2.6,legM); f.position.set(0,top-H+0.5,k*s); g.add(f); var tp=box(1.9,0.9,2.6,legM); tp.position.set(0,top-0.45,k*s); g.add(tp); });
  } else if(style==="panel"){
    var pn=box(1.3,H,len-1.5,legM); pn.position.set(0,top-H/2,0); g.add(pn);
  } else {
    [-1,1].forEach(function(k){ var l=box(1.6,H,1.6,legM); l.position.set(0,top-H/2,k*s); g.add(l); });
  }
  return g;
}
function buildDesk(){
  var g=new THREE.Group(), dc=DESK_COLORS.filter(function(c){ return c.id===desk.color; })[0]||DESK_COLORS[0];
  var edge=mat(mix(dc.base,"#000000",0.22),0.75);
  var lc=LEG_COLORS.filter(function(c){ return c.id===desk.legColor; })[0]||LEG_COLORS[0];
  var legM = lc.id==="wood" ? new THREE.MeshStandardMaterial({ map:deskTexture(dc), roughness:0.7 }) : mat(lc.hex, lc.metal?0.3:0.5, lc.metal?0.85:0.45);
  var footM=mat(0x111111,0.9), style=desk.legs||"four";
  var rects=deskRects(), main=rects[0], hd=DESK_D/2, H=DESK_H-DESK_TOP;
  function slab(x0,x1,z0,z1){
    var w=x1-x0, d=z1-z0; if(w<=0.01||d<=0.01) return;
    var tx=deskTexture(dc).clone(); tx.needsUpdate=true; tx.isSharedTex=false; tx.repeat.set(w/60,d/30);
    var top=box(w,DESK_TOP,d,[edge,edge,new THREE.MeshStandardMaterial({ map:tx, roughness:dc.grain?0.7:0.55 }),edge,edge,edge]);
    top.position.set((x0+x1)/2,-DESK_TOP/2,(z0+z1)/2); g.add(top);
  }
  slab(main.x0,main.x1,main.z0,main.z1);
  if(rects[1]){ var w=rects[1]; slab(w.x0,w.x1,hd,w.z1); }
  g.children.forEach(function(c){ c.userData.deskPart="top"; });
  var frame=new THREE.Group(); g.add(frame);
  if(style==="wall"){ buildWallMount(frame,rects,legM); tagDesk(frame); return g; }
  deskEnds().forEach(function(e){ var f=legFrame(style,e.len,legM,footM); f.position.set(e.x,0,e.z); f.rotation.y=e.rot; frame.add(f); });
  if(style==="panel"){
    var back=box(DESK_W-3,H*0.45,0.6,legM); back.position.set(0,-DESK_TOP-H*0.225,-hd+3); frame.add(back);
  } else if(style==="tframe"){
    var beam=box(DESK_W-8,1.6,1.6,legM); beam.position.set(0,-DESK_TOP-0.9,0); frame.add(beam);
  } else {
    var rail=box(DESK_W-5,2.2,0.8,legM); rail.position.set(0,-DESK_TOP-1.1,-hd+2.5); frame.add(rail);
  }
  tagDesk(frame);
  return g;
}
function tagDesk(frame){ frame.traverse(function(n){ if(n.isMesh && !n.userData.deskPart) n.userData.deskPart="frame"; }); }
/* wall-mounted top: triangular brackets under the back edge, plus a plain wall surface behind the desk only */
function buildWallMount(frame,rects,legM){
  var hd=DESK_D/2, main=rects[0], wing=rects[1], y0=-DESK_TOP;
  function bracket(x,z,dirX,dirZ,depth){
    var bg=new THREE.Group(); bg.position.set(x,0,z); bg.rotation.y=Math.atan2(dirX,dirZ); frame.add(bg);
    var plate=box(1.6,9,0.35,legM); plate.position.set(0,y0-4.8,0.18); bg.add(plate);
    var arm=box(1.3,0.9,depth,legM); arm.position.set(0,y0-0.45,depth/2); bg.add(arm);
    bg.add(rod(V(0,y0-8.6,0.4),V(0,y0-0.9,depth*0.78),0.42,legM));
    bg.traverse(function(n){ if(n.isMesh) n.userData.deskPart="bracket"; });
  }
  var span=main.x1-main.x0, n=Math.max(2,Math.ceil(span/32)), inset=6;
  for(var i=0;i<n;i++){ var x=main.x0+inset+(span-2*inset)*i/(n-1); bracket(x,main.z0,0,1,DESK_D*0.68); }
  var bb=deskBounds(), wallM=new THREE.MeshStandardMaterial({ color:lin(P.dark?"#2b2d32":"#efe9dd"), roughness:0.95 });
  var WH=100, wallW=(bb.x1-bb.x0)+30;
  var back=new THREE.Mesh(new THREE.PlaneGeometry(wallW,WH),wallM); back.receiveShadow=true;
  back.position.set((bb.x0+bb.x1)/2,-DESK_H+WH/2,main.z0-0.05); back.userData.deskPart="wallVisual"; frame.add(back);
  if(wing){
    var right=desk.shape==="lRight", sx=right?wing.x1:wing.x0, len=wing.z1-hd, m2=Math.max(1,Math.ceil(len/32));
    for(var j=0;j<m2;j++){ var z=hd+(len-4)*(j+0.5)/m2; bracket(sx,z,right?-1:1,0,(wing.x1-wing.x0)*0.68); }
    var sideLen=(wing.z1-main.z0)+15;
    var side=new THREE.Mesh(new THREE.PlaneGeometry(sideLen,WH),wallM); side.receiveShadow=true;
    side.rotation.y=right?-Math.PI/2:Math.PI/2; side.position.set(sx+(right?0.05:-0.05),-DESK_H+WH/2,main.z0+sideLen/2);
    side.userData.deskPart="wallVisual"; frame.add(side);
  }
}
/* solid parts of the desk underneath the top (legs, rails, panels, brackets) and the wall, in world space */
var deskObstacles=[];
function computeDeskObstacles(){
  deskObstacles=[];
  if(!deskGroup) return;
  deskGroup.updateMatrixWorld(true);
  deskGroup.traverse(function(n){
    var tag=n.userData.deskPart;
    if(!n.isMesh || !tag || tag==="top" || tag==="wallVisual") return;
    var rd=n.userData.rod;
    if(rd){
      var sl=Math.max(1,Math.min(6,Math.round(rd.len/3)));
      for(var i=0;i<sl;i++){ var y0=-rd.len/2+rd.len*i/sl, y1=-rd.len/2+rd.len*(i+1)/sl;
        deskObstacles.push({ b:new THREE.Box3(V(-rd.r,y0,-rd.r),V(rd.r,y1,rd.r)).applyMatrix4(n.matrixWorld), tag:tag }); }
      return;
    }
    if(!n.geometry.boundingBox) n.geometry.computeBoundingBox();
    deskObstacles.push({ b:n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld), tag:tag });
  });
  if(desk.legs==="wall"){
    var bb=deskBounds(), rects=deskRects(), main=rects[0], wing=rects[1];
    deskObstacles.push({ b:new THREE.Box3(V(bb.x0-15,0,main.z0-6),V(bb.x1+15,DESK_H+60,main.z0)), tag:"wall" });
    if(wing){ var right=desk.shape==="lRight", sx=right?wing.x1:wing.x0;
      deskObstacles.push({ b:new THREE.Box3(V(right?sx:sx-6,0,main.z0-6),V(right?sx+6:sx,DESK_H+60,wing.z1+15)), tag:"wall" }); }
  }
}
function deskHit(e){
  /* which part of the desk structure this item runs into, if any */
  var g=groupOf(e.it);if(hitsDeskTop(e))return "top";
  var floorItem=layerOf(e.it)==="floor", ps=worldParts(e), hit=null;
  deskObstacles.forEach(function(o){
    if(hit || (!floorItem && o.tag!=="wall")) return;
    if(!hit3(e.wbox,o.b,TOL)) return;
    for(var i=0;i<ps.length;i++) if(hit3(ps[i],o.b,TOL)){ hit=o.tag; break; }
  });
  return hit;
}
function obstacleName(tag){if(tag==="top")return t("deskTop"); return tag==="wall"?t("wallWord"):tag==="bracket"?t("deskBracket"):t("deskLeg"); }

/* ================= entries & placement ================= */
var entries={}, sceneVer=0;
function bump(){ sceneVer++; }
function worldBox(e){ if(!e.lparts) return new THREE.Box3().setFromObject(e.group); worldParts(e); return e.wbox.clone(); }
function applyTransform(e){
  var it=e.it; e.group.position.set(it.x, layerOf(it)==="floor" ? -DESK_H : (e.lift||0), it.z);
  e.group.rotation.y=it.rot||0; e.group.updateMatrixWorld(true); e.placed=true; bump();
}
function eachEntry(fn){ Object.keys(entries).forEach(function(k){ fn(entries[k]); }); }
function boxesHit(a,b,m){ return a.min.x<b.max.x-m && a.max.x>b.min.x+m && a.min.z<b.max.z-m && a.max.z>b.min.z+m; }
/* Footprint = only the part that actually sits on the surface (a monitor's base,
   a plant's pot, a headphone stand's disc). Overhanging parts above it
   (screens, leaves, headbands, boom arms) never count as a collision. */
function footprintLocal(it){
  var k=it.kind, v;
  if(k==="custom") return { x:0, z:0, w:clamp(+it.w||30,1,300)*CM, d:clamp(+it.d||20,1,200)*CM };
  if(k==="monitor"){
    var d=screenDims(it), D=it.diagonal, pT=clamp(0.5+D*0.012,0.6,1.3);
    if(it.mount==="arm") return { x:0, z:-(pT/2+6)+1.4, w:2.6, d:2.8 };
    var baseW=clamp(Math.max(d.w,d.h)*0.3,7,17), baseD=clamp(D*0.27,6.5,11), neckT=clamp(D*0.03,0.7,1.4), neckZ=-(pT/2+neckT/2+0.25);
    return { x:0, z:neckZ+baseD*0.28, w:baseW, d:baseD };
  }
  if(k==="laptop"){
    var d2=screenDims(it), bz=clamp(it.diagonal*0.022,0.25,0.45), bw=d2.w+bz*2+0.2, bd=(d2.h+bz*2.4)*0.97;
    return { x:0, z:bd*0.05, w:bw, d:bd };
  }
  v=variantOf(it);
  if(k==="keyboard"||k==="mouse"||k==="mousepad") return { x:0, z:0, w:v.w, d:v.d };
  if(k==="pc"||k==="riser") return { x:0, z:0, w:v.w*CM, d:v.d*CM };
  if(k==="mic") return { x:0, z:0, w:v.base*CM, d:v.base*CM };
  if(k==="headphones"){
    if(v.id==="stand") return { x:0, z:0, w:5, d:5 };
    if(v.id==="flat") return { x:0, z:1.45, w:8.2, d:7.5 };
    return { x:0, z:1.4, w:2.6, d:2.8 };
  }
  if(k==="plant"){ var pr=({ cactus:1.9, leafy:2.7, trailing:2.5, floor:6.2 }[v.id]||2.5)*plantScale(it); return { x:0, z:0, w:pr*2+0.3, d:pr*2+0.3 }; }
  if(k==="micArm") return v.id==="floor" ? { x:0, z:0, w:22, d:22 } : { x:0, z:1.4, w:2.6, d:2.8 };
  if(k==="chair"){ var c=chairSpec(it); return { x:0, z:0, w:c.legR*2+2, d:c.legR*2+2 }; }
  return null;
}
function footBox(e){
  var f=footprintLocal(e.it);
  if(!f){ var wb=worldBox(e); return { min:{ x:wb.min.x, z:wb.min.z }, max:{ x:wb.max.x, z:wb.max.z } }; }
  var r=e.it.rot||0, c=Math.cos(r), sn=Math.sin(r), ox=e.it.x, oz=e.it.z, xs=[], zs=[];
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    var lx=f.x+p[0]*f.w/2, lz=f.z+p[1]*f.d/2;
    xs.push(ox+lx*c+lz*sn); zs.push(oz-lx*sn+lz*c);
  });
  return { min:{ x:Math.min.apply(null,xs), z:Math.min.apply(null,zs) }, max:{ x:Math.max.apply(null,xs), z:Math.max.apply(null,zs) } };
}
function shiftBox(b,dx,dz){ return { min:{ x:b.min.x+dx, z:b.min.z+dz }, max:{ x:b.max.x+dx, z:b.max.z+dz } }; }
var TOUCH_OK=0.8; /* up to ~2 cm of footprint contact is fine: things sit right next to each other */
function onDesk(e){
  var g=groupOf(e.it);
  if(g==="floor"||edgeMounted(e.it)) return true;
  if(g==="air") return pointOnDesk(e.it.x,e.it.z,1);
  return boxOnDesk(footBox(e));
}
function shiftInto(b,r){
  var dx=0,dz=0;
  if(b.max.x-b.min.x > r.x1-r.x0) dx=(r.x0+r.x1)/2-(b.min.x+b.max.x)/2; else if(b.min.x<r.x0) dx=r.x0-b.min.x; else if(b.max.x>r.x1) dx=r.x1-b.max.x;
  if(b.max.z-b.min.z > r.z1-r.z0) dz=(r.z0+r.z1)/2-(b.min.z+b.max.z)/2; else if(b.min.z<r.z0) dz=r.z0-b.min.z; else if(b.max.z>r.z1) dz=r.z1-b.max.z;
  return { dx:dx, dz:dz };
}
/* ---- 3D collision: each item is a handful of solid boxes built from its real meshes,
   so a screen hovering over a keyboard or a headband arching over a mouse never
   counts, while headphones sitting on a laptop or a chair back inside the desk do. ---- */
var TOL=0.3; /* ~0.8 cm of contact is allowed: things can touch */
var _m4=new THREE.Matrix4(), _inv=new THREE.Matrix4();
function computeLocalParts(g){
  g.updateMatrixWorld(true);
  _inv.copy(g.matrixWorld).invert();
  var parts=[];
  g.traverse(function(n){
    if(!n.isMesh || !n.geometry) return;
    _m4.multiplyMatrices(_inv,n.matrixWorld);
    var rd=n.userData.rod;
    if(rd){
      var sl=Math.max(1,Math.min(6,Math.round(rd.len/3)));
      for(var i=0;i<sl;i++){
        var y0=-rd.len/2+rd.len*i/sl, y1=-rd.len/2+rd.len*(i+1)/sl;
        parts.push(new THREE.Box3(V(-rd.r,y0,-rd.r),V(rd.r,y1,rd.r)).applyMatrix4(_m4));
      }
      return;
    }
    if(!n.geometry.boundingBox) n.geometry.computeBoundingBox();
    var b=n.geometry.boundingBox.clone().applyMatrix4(_m4);
    var sz=b.getSize(V(0,0,0)); if(sz.x<0.02&&sz.y<0.02&&sz.z<0.02) return;
    parts.push(b);
  });
  if(parts.length>36 && !g.userData.edgeMounted){
    var all=new THREE.Box3(); parts.forEach(function(p){ all.union(p); });
    var S=all.getSize(V(0,0,0)), cells={};
    parts.forEach(function(p){
      var c=p.getCenter(V(0,0,0));
      var k=[0,1,2].map(function(ax){ var a=["x","y","z"][ax]; return Math.min(3,Math.floor((c[a]-all.min[a])/(S[a]/4+1e-6))); }).join(",");
      (cells[k]=cells[k]||new THREE.Box3()).union(p);
    });
    parts=Object.keys(cells).map(function(k){ return cells[k]; });
  }
  return parts;
}
function worldParts(e){
  var key=e.it.x+"|"+e.it.z+"|"+(e.it.rot||0)+"|"+e.group.position.y;
  if(e._wk!==key){
    e._wk=key; e.group.updateMatrixWorld(true);
    var box3=new THREE.Box3();
    e.wparts=e.lparts.map(function(p){ var q=p.clone().applyMatrix4(e.group.matrixWorld); box3.union(q); return q; });
    e.wbox=box3;
  }
  return e.wparts;
}
function hit3(a,b,t){ return a.min.x<b.max.x-t && a.max.x>b.min.x+t && a.min.y<b.max.y-t && a.max.y>b.min.y+t && a.min.z<b.max.z-t && a.max.z>b.min.z+t; }
function isPlatform(it){ return it.kind==="mousepad"||it.kind==="riser"; }
function restsOn(top,plat){
  /* true when `top` sits on platform `plat` (its base centre is inside the platform) */
  if(!isPlatform(plat.it) || top===plat || layerOf(top.it)==="floor"||edgeMounted(top.it)) return false;
  if(isPlatform(top.it) && liftRank(top.it)>=liftRank(plat.it)) return false;
  var f=footBox(top), p=footBox(plat), cx=(f.min.x+f.max.x)/2, cz=(f.min.z+f.max.z)/2;
  return cx>p.min.x && cx<p.max.x && cz>p.min.z && cz<p.max.z;
}
function collides(a,b){
  if(a===b || !a.placed || !b.placed) return false;
  if(restsOn(a,b) || restsOn(b,a)) return false;
  var ga=groupOf(a.it), gb=groupOf(b.it);
  if(ga===gb && (ga==="mat"||ga==="riser")) return boxesHit(footBox(a),footBox(b),TOUCH_OK);
  var pa=worldParts(a), pb=worldParts(b);
  if(!hit3(a.wbox,b.wbox,TOL)) return false;
  for(var i=0;i<pa.length;i++){ if(!hit3(pa[i],b.wbox,TOL)) continue; for(var j=0;j<pb.length;j++) if(hit3(pa[i],pb[j],TOL)) return true; }
  return false;
}
function collidesAny(e){ var r=null; eachEntry(function(o){ if(!r && collides(e,o)) r=o; }); return r; }
/* tidy spacing for automatic placement: whole outlines of neighbours stay apart,
   so a new screen never ends up hiding a laptop. Manual placement only uses collides(). */
function crowds(e){
  var g=groupOf(e.it); if(g==="air") return false;
  var b=worldBox(e), hit=false;
  eachEntry(function(o){
    if(hit||o===e||!o.placed||groupOf(o.it)!==g||restsOn(e,o)||restsOn(o,e)) return;
    if(boxesHit(b,worldBox(o),0.25)) hit=true;
  });
  return hit;
}
/* floor items may slide under the desk, but nothing tall may pass through the top */
function slabParts(e){ var lo=DESK_H-DESK_TOP+0.05, hi=DESK_H-0.05; return worldParts(e).filter(function(p){ return p.max.y>lo && p.min.y<hi; }); }
function partHitsRect(p,r,dx,dz){ return p.min.x+dx<r.x1-0.05 && p.max.x+dx>r.x0+0.05 && p.min.z+dz<r.z1-0.05 && p.max.z+dz>r.z0+0.05; }
function hitsDeskTop(e,dx,dz){
  if(layerOf(e.it)!=="floor"&&!edgeMounted(e.it)) return false;
  var ps=slabParts(e), rs=deskRects(); dx=dx||0; dz=dz||0;
  return ps.some(function(p){ return rs.some(function(r){ return partHitsRect(p,r,dx,dz); }); });
}
function pushOutOfDesk(e){
  if(!hitsDeskTop(e)) return;
  var ps=slabParts(e), rs=deskRects(), cands=[];
  ps.forEach(function(p){ rs.forEach(function(r){ if(partHitsRect(p,r,0,0)){
    cands.push([r.x0-p.max.x-0.1,0],[r.x1-p.min.x+0.1,0],[0,r.z0-p.max.z-0.1],[0,r.z1-p.min.z+0.1]); } }); });
  cands.sort(function(a,b){ return Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1]); });
  var pick=null;
  for(var i=0;i<cands.length && !pick;i++){ if(!hitsDeskTop(e,cands[i][0],cands[i][1])) pick=cands[i]; }
  if(!pick){ var bb=deskBounds(), mz=Math.min.apply(null,ps.map(function(p){ return p.min.z; })); pick=[0,bb.z1-mz+0.1]; }
  e.it.x+=pick[0]; e.it.z+=pick[1]; applyTransform(e);
}
function keepInside(e){
  var it=e.it, g=groupOf(it), bb=deskBounds();
  if(edgeMounted(it)){snapClamp(e);return;}
  if(g==="floor"){ it.x=clamp(it.x,bb.x0-50,bb.x1+50); it.z=clamp(it.z,bb.z0-40,bb.z1+70); applyTransform(e); pushOutOfDesk(e); return; }
  if(g==="air"){
    if(pointOnDesk(it.x,it.z,1)) return;
    var bestA=null; deskRects().forEach(function(r){ var nx=clamp(it.x,r.x0,r.x1), nz=clamp(it.z,r.z0,r.z1), c=Math.hypot(nx-it.x,nz-it.z); if(!bestA||c<bestA.c) bestA={ x:nx, z:nz, c:c }; });
    it.x=bestA.x; it.z=bestA.z; applyTransform(e); return;
  }
  var b=footBox(e); if(boxOnDesk(b,0.05)) return;
  var best=null;
  deskRects().forEach(function(r){
    var s=shiftInto(b,r), nb=shiftBox(b,s.dx,s.dz), c=Math.hypot(s.dx,s.dz);
    if(boxOnDesk(nb,0.05) && (!best||c<best.c)) best={ s:s, c:c };
  });
  if(!best) best={ s:shiftInto(b,deskBounds()) };
  it.x+=best.s.dx; it.z+=best.s.dz; applyTransform(e);
}
function findPlaced(kind,filter){ var r=null; eachEntry(function(o){ if(!r && o.placed && o.it.kind===kind && (!filter||filter(o))) r=o; }); return r; }
function updateLifts(){
  var plats=[];
  [1,2,3].forEach(function(rank){
    eachEntry(function(o){
      if(!o.placed || layerOf(o.it)==="floor" || edgeMounted(o.it) || liftRank(o.it)!==rank) return;
      var lift=0, fb=footBox(o), cx=(fb.min.x+fb.max.x)/2, cz=(fb.min.z+fb.max.z)/2;
      plats.forEach(function(p){ if(p.rank<rank && cx>p.b.min.x && cx<p.b.max.x && cz>p.b.min.z && cz<p.b.max.z) lift=Math.max(lift,p.top); });
      if(lift!==o.lift){ o.lift=lift; o.group.position.y=lift; o.group.updateMatrixWorld(true); bump(); }
      if(rank<3){ plats.push({ rank:rank, b:footBox(o), top:worldBox(o).max.y-DESK_H }); }
    });
  });
}
function autoPlace(e){
  var it=e.it, k=it.kind, hd=DESK_D/2, hw=DESK_W/2, lay=layerOf(it);
  it.rot=it.rot||0; it.x=0; it.z=0; applyTransform(e);
  if(edgeMounted(it)){
    it.x=it.kind==='headphones'?hw-6:-hw+8;it.z=it.kind==='headphones'?hd:-hd;
    var edges=mountEdges().filter(function(edge){return !it.mountSide||it.mountSide==='auto'||edge.side===it.mountSide;}),fallback=null;
    var preferred=it.kind==='headphones'?'front':'back';edges.sort(function(a,b){return (a.side===preferred?0:1)-(b.side===preferred?0:1);});
    for(var ei=0;ei<edges.length;ei++){var edge=edges[ei];
      for(var v=edge.lo+4.6;v<=edge.hi-4.6;v+=3){
        var anchor=clampAnchor(it);it.rot=Math.atan2(edge.nx,edge.nz);
        it.x=(edge.axis==='x'?v:edge.fixed)-anchor.z*Math.sin(it.rot);it.z=(edge.axis==='x'?edge.fixed:v)-anchor.z*Math.cos(it.rot);
        applyTransform(e);if(!fallback)fallback={x:it.x,z:it.z,rot:it.rot};if(!collidesAny(e)&&!deskHit(e))return;
      }
    }
    if(fallback)Object.assign(it,fallback);snapClamp(e);return;
  }
  var b=worldBox(e), w=b.max.x-b.min.x, d=b.max.z-b.min.z, z, startX=0, dir=0;
  var kb=findPlaced("keyboard");
  if(k==="monitor"||k==="laptop"){ z=-hd+1.5-b.min.z; }
  else if(k==="keyboard"){ z=hd-4-b.max.z; }
  else if(k==="mouse"){
    z=hd-5-b.max.z;
    var pad=findPlaced("mousepad",function(p){ return p.it.variant!=="xl"; });
    if(pad){ var pb=worldBox(pad); it.x=(pb.min.x+pb.max.x)/2; it.z=(pb.min.z+pb.max.z)/2; applyTransform(e); if(!collidesAny(e)&&onDesk(e)) return; }
    if(kb){ var kbb=worldBox(kb); startX=kbb.max.x+3+w/2; z=(kbb.min.z+kbb.max.z)/2; dir=1; }
  }
  else if(k==="mousepad"){ z=hd-1.5-b.max.z; if(kb){ var k2=worldBox(kb); if(it.variant==="xl") startX=(k2.min.x+k2.max.x)/2+6; else { startX=k2.max.x+1.5+w/2; dir=1; } } }
  else if(k==="riser"){
    z=-hd+1-b.min.z;
    var mon=findPlaced("monitor"); if(mon) startX=mon.it.x;
  }
  else if(k==="mic"){ z=hd-9-b.max.z; if(kb){ var k3=worldBox(kb); startX=k3.min.x-4-w/2; dir=-1; } else { startX=-hw+w/2+6; dir=1; } }
  else if(k==="micArm" && lay!=="floor"){ z=-hd+0.3; startX=-hw+8; dir=1; }
  else if(k==="pc" && lay==="desk"){ z=-hd+1.5-b.min.z; var side=desk.shape==="lLeft"?-1:1; startX=side*(hw-w/2-2); dir=-side; }
  else if(k==="pc"){ var s2=desk.shape==="lRight"?-1:1; z=-hd+d/2+3; startX=s2*(hw-w/2-4); dir=-s2; }
  else if(k==="micArm"){ z=hd+6; startX=-hw-10; dir=-1; }
  else if(k==="headphones" && it.variant==="hook"){ z=hd-0.6; startX=hw-6; dir=-1; }
  else if(k==="headphones"){ z=-hd+8-b.min.z; startX=hw-w/2-3; dir=-1; }
  else if(k==="custom" && lay==="floor"){ z=hd+6; startX=hw+w/2+6; dir=1; }
  else if(k==="custom"){ z=-hd+1.5-b.min.z; startX=0; }
  else if(k==="plant" && lay==="floor"){ z=-hd+b.max.z+2; startX=-hw-b.max.x-4; dir=-1; }
  else if(k==="plant"){ z=-hd+1.5-b.min.z; startX=-hw+w/2+2; dir=1; }
  else { z=hd+5; }
  var zDir = (lay==="floor"||groupOf(it)==="air") ? 0 : (z<0 ? 1 : -1);
  var rows = zDir ? [0,4,8,12,16,20,24,28] : [0];
  for(var pass=0; pass<2; pass++){
    for(var ri=0; ri<rows.length; ri++){
      var zz=z+zDir*rows[ri];
      for(var s=0;s<260;s++){
        var off = dir!==0 ? (s<170 ? dir*s*0.5 : -dir*(s-169)*0.5) : (s%2===0?1:-1)*Math.ceil(s/2)*0.5;
        it.x=startX+off; it.z=zz; applyTransform(e);
        if((pass===1 || !crowds(e)) && !collidesAny(e) && (lay==="floor" ? !hitsDeskTop(e) : onDesk(e))) return;
      }
    }
  }
  it.x=startX; it.z=z; applyTransform(e); keepInside(e);
}
function tagGroup(g,it){ g.traverse(function(n){ n.userData.itemId=it.id; }); }
function makeEntry(it){
  var g=buildItem(it);g.userData.edgeMounted=edgeMounted(it); tagGroup(g,it); itemsGroup.add(g);
  g.updateMatrixWorld(true);
  var e={ it:it, group:g, lift:0, placed:false };
  e.size=new THREE.Box3().setFromObject(g).getSize(V(0,0,0));
  e.lparts=computeLocalParts(g);
  return e;
}
function rebuild(opts){
  opts=opts||{};
  DESK_W=desk.w*CM; DESK_D=desk.d*CM; DESK_H=desk.h*CM;DESK_TOP=desk.thickness*CM;
  world.position.y=DESK_H; world.updateMatrixWorld(true);
  if(deskGroup){ world.remove(deskGroup); disposeTree(deskGroup); }
  itemsGroup.children.slice().forEach(function(c){ itemsGroup.remove(c); disposeTree(c); });
  entries={};
  deskGroup=buildDesk(); world.add(deskGroup); computeDeskObstacles();
  items.forEach(function(it){ entries[it.id]=makeEntry(it); });
  items.forEach(function(it){ if(isNum(it.x)&&isNum(it.z)) applyTransform(entries[it.id]); });
  items.filter(function(it){ return !(isNum(it.x)&&isNum(it.z)); }).sort(function(a,b){ return KINDS[a.kind].order-KINDS[b.kind].order; })
       .forEach(function(it){ autoPlace(entries[it.id]); updateLifts(); });
  eachEntry(function(e){if(edgeMounted(e.it)||opts.contain)keepInside(e);});
  eachEntry(function(e){ if(e.placed && layerOf(e.it)==="floor") pushOutOfDesk(e); });
  updateLifts();
  var bb=deskBounds(), half=Math.max(bb.x1-bb.x0,bb.z1-bb.z0)/2+55, sc=key.shadow.camera;
  sc.left=-half; sc.right=half; sc.top=half; sc.bottom=-half; sc.near=1; sc.far=600; sc.updateProjectionMatrix();
  key.target.position.set(0,DESK_H,0); key.position.set(-DESK_W*0.3,DESK_H+130,95);
  saveItems();
  if(selectedId!=null && !entries[selectedId]) selectedId=null;
  updateFit(); refreshSelection(); bump();
  if(opts.reframe!==false) computeFrame();
}
function rebuildOne(id){
  var e=entries[id]; if(!e) return;
  var it=e.it;
  itemsGroup.remove(e.group); disposeTree(e.group);
  var ne=makeEntry(it); entries[id]=ne;
  if(isNum(it.x)&&isNum(it.z)) applyTransform(ne); else autoPlace(ne);
  keepInside(ne); updateLifts(); saveItems(); updateFit(); refreshSelection(); bump();
}

/* ================= camera ================= */
var target=V(0,40,0), goalTarget=target.clone();
var theta=-0.4, phi=1.12, radius=150, goalTheta=theta, goalPhi=phi, goalRadius=radius, visAspect=1;
function computeFrame(){
  var bb=deskBounds(), b=new THREE.Box3();
  b.expandByPoint(V(bb.x0,DESK_H,bb.z0)); b.expandByPoint(V(bb.x1,DESK_H,bb.z1));
  eachEntry(function(e){ b.union(worldBox(e)); });
  var c=b.getCenter(V(0,0,0)), s=b.getSize(V(0,0,0));
  goalTarget.set(c.x, goalPhi<0.5 ? DESK_H : Math.max(DESK_H+5,c.y), c.z);
  var tn=Math.tan(camera.fov*Math.PI/360), a=visAspect||1, halfW, halfH;
  if(goalPhi<0.5){ halfW=s.x/2+6; halfH=s.z/2+6; }
  else if(Math.abs(Math.sin(goalTheta))>0.9){ halfW=s.z/2+8; halfH=s.y/2+6; }
  else { halfW=s.x/2+6; halfH=Math.max(s.y,s.z*0.7)/2+6; }
  goalRadius=clamp(Math.max(halfH/tn, halfW/(tn*a))*(goalPhi<0.5?1.3:1.2)+(goalPhi<0.5?15:6), 30, 1000);
}
function setView(v){
  if(v==="front"){ goalTheta=0; goalPhi=1.42; } else if(v==="top"){ goalTheta=0; goalPhi=0.08; }
  else if(v==="side"){ goalTheta=-Math.PI/2; goalPhi=1.35; } else { goalTheta=-0.55; goalPhi=1.0; }
  var tw=Math.PI*2; theta=theta-Math.round((theta-goalTheta)/tw)*tw;
  document.querySelectorAll("#viewbar button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.view===v?"true":"false"); });
  computeFrame();
}
document.querySelectorAll("#viewbar button").forEach(function(b){ b.addEventListener("click", function(){ setView(b.dataset.view); }); });
function resize(){
 var w=window.innerWidth,h=Math.max(1,window.innerHeight);renderer.setSize(w,h,false);
 var p=document.getElementById("panel"),pw=isMobile()?0:Math.min(376,w),sh=isMobile()?p.getBoundingClientRect().height:0;
 camera.aspect=(w+pw)/(h+sh);camera.setViewOffset(w+pw,h+sh,settings.lang==="ar"?0:pw,sh,w,h);
 visAspect=Math.max(1,w-pw)/Math.max(1,h-sh);camera.updateProjectionMatrix();
 document.documentElement.style.setProperty("--sheet-height",sh+"px");bump();
}

window.addEventListener("resize", function(){ resize(); computeFrame(); });

/* ================= selection & interaction ================= */
var selectedId=null, selHelper=null, editorOpen=false;
var raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
function setNdc(cx,cy){ var r=canvas.getBoundingClientRect(); ndc.set(((cx-r.left)/r.width)*2-1, -((cy-r.top)/r.height)*2+1); raycaster.setFromCamera(ndc,camera); }
function pick(cx,cy){
  setNdc(cx,cy);
  var hits=raycaster.intersectObjects(itemsGroup.children,true);
  for(var i=0;i<hits.length;i++){ var id=hits[i].object.userData.itemId; if(id!=null && entries[id]) return entries[id]; }
  return null;
}
function isMobile(){ return window.innerWidth<=820; }
function mobileReveal(){ if(isMobile() && typeof setPanel==="function") setPanel(false); }
function select(id){if(id!==selectedId)editorOpen=false;selectedId=id;refreshSelection();renderList();}
/* distance from the selected item to the desk edges (cm), or for a chair how far it sits from the front edge */
function edgeText(e){
  var g=groupOf(e.it);
  if(g==="air") return "";
  var rects=deskRects();
  if(layerOf(e.it)==="floor"){
    if(e.it.kind!=="chair") return "";
    var wb=worldBox(e), cx=(wb.min.x+wb.max.x)/2, front=null;
    rects.forEach(function(r){ if(cx>=r.x0 && cx<=r.x1) front=front==null?r.z1:Math.max(front,r.z1); });
    if(front==null) return "";
    var gap=wb.min.z-front;
    return gap>=0 ? t("chairOut",toCm(gap)) : t("chairIn",toCm(-gap));
  }
  var fb=footBox(e), mx=(fb.min.x+fb.max.x)/2, mz=(fb.min.z+fb.max.z)/2, r0=rects[0];
  rects.forEach(function(r){ if(mx>=r.x0 && mx<=r.x1 && mz>=r.z0 && mz<=r.z1) r0=r; });
  return t("edges", toCm(fb.min.x-r0.x0), toCm(r0.x1-fb.max.x), toCm(r0.z1-fb.max.z), toCm(fb.min.z-r0.z0));
}
function refreshSelection(){
  bump();
  if(selHelper){ scene.remove(selHelper); selHelper.geometry.dispose(); selHelper.material.dispose(); selHelper=null; }
  var e=selectedId!=null?entries[selectedId]:null, insp=document.getElementById("insp");
  document.getElementById("hint").hidden=!!e;
  if(!e){ insp.hidden=true;renderEditor();return; }
  selHelper=new THREE.BoxHelper(e.group,P.sel); selHelper.material.depthTest=false; selHelper.renderOrder=10; scene.add(selHelper);
  insp.hidden=false;
  document.getElementById("inspName").textContent=nameOf(e.it);
  var s=e.size, meta=t("area")+" "+dims(toCm(s.x),toCm(s.z))+" · "+t("tall")+" "+toCm(s.y)+" "+t("cm");
  if(e.it.kind==="chair") meta=t("seatAt")+" "+toCm(chairSpec(e.it).seatH)+" · "+t("deskAt")+" "+desk.h+" "+t("cm");
  if(!onDesk(e)) meta+=" · "+t("outside");
  var partner=clashLabel(e.it.id);
  if(partner) meta+=" · "+t("hitsWith",partner);
  document.getElementById("inspMeta").textContent=meta;
  document.getElementById("inspEdges").textContent=edgeText(e);
  renderEditor();
}

var itemDrag=null, orbit=null, pts={}, pinch0=null, tapHints=0;
var dragPlane=new THREE.Plane(V(0,1,0),0), hitPt=V(0,0,0);
canvas.addEventListener("contextmenu", function(e){ e.preventDefault(); });
canvas.addEventListener("pointerdown", function(ev){
  pts[ev.pointerId]={ x:ev.clientX, y:ev.clientY };
  try{ canvas.setPointerCapture(ev.pointerId); }catch(_){}
  if(Object.keys(pts).length===2){ itemDrag=null; orbit=null; pinch0=null; return; }
  var e=ev.button===0 ? pick(ev.clientX,ev.clientY) : null;
  if(e && ev.pointerType==="touch" && selectedId!==e.it.id){
    /* on touch the first tap only selects, so trying to rotate the view never moves furniture */
    orbit={ x:ev.clientX, y:ev.clientY, sx:ev.clientX, sy:ev.clientY, pan:false, keep:true, itemId:e.it.id };
    return;
  }
  if(e){
    dragPlane.constant=-(layerOf(e.it)==="floor" ? 0 : DESK_H);
    setNdc(ev.clientX,ev.clientY);
    if(raycaster.ray.intersectPlane(dragPlane,hitPt)){ itemDrag={ e:e, ox:e.it.x-hitPt.x, oz:e.it.z-hitPt.z, sx:ev.clientX, sy:ev.clientY, moved:false }; canvas.style.cursor="grabbing"; }
  } else { orbit={ x:ev.clientX, y:ev.clientY, sx:ev.clientX, sy:ev.clientY, pan:ev.button===2||ev.shiftKey }; canvas.style.cursor="grabbing"; }
});
canvas.addEventListener("pointermove", function(ev){
  if(pts[ev.pointerId]) pts[ev.pointerId]={ x:ev.clientX, y:ev.clientY };
  var ids=Object.keys(pts);
  if(ids.length===2){ var a=pts[ids[0]], b=pts[ids[1]], dd=Math.hypot(a.x-b.x,a.y-b.y); if(pinch0) goalRadius=clamp(goalRadius*pinch0/dd,25,1000); pinch0=dd; return; }
  if(itemDrag){
    if(!itemDrag.moved && Math.hypot(ev.clientX-itemDrag.sx, ev.clientY-itemDrag.sy)<4) return;
    setNdc(ev.clientX,ev.clientY);
    if(raycaster.ray.intersectPlane(dragPlane,hitPt)){ var it=itemDrag.e.it; selectedId=it.id;it.x=hitPt.x+itemDrag.ox; it.z=hitPt.z+itemDrag.oz; applyTransform(itemDrag.e); keepInside(itemDrag.e); updateLifts(); itemDrag.moved=true; }
    return;
  }
  if(orbit){
    var dx=ev.clientX-orbit.x, dy=ev.clientY-orbit.y; orbit.x=ev.clientX; orbit.y=ev.clientY;
    if(orbit.pan){ var s=radius*0.0016, right=V(Math.cos(theta),0,-Math.sin(theta)); goalTarget.addScaledVector(right,-dx*s); goalTarget.y+=dy*s; }
    else { goalTheta-=dx*0.006; goalPhi=clamp(goalPhi-dy*0.005,0.06,1.55); }
    return;
  }
  if(ev.pointerType==="mouse") canvas.style.cursor=pick(ev.clientX,ev.clientY)?"pointer":"grab";
});
function endPointer(ev){
  delete pts[ev.pointerId]; pinch0=null;
  if(itemDrag){ if(itemDrag.moved){ saveItems(); updateFit(); refreshSelection(); }else if(ev.type!=="pointercancel")openEditor(itemDrag.e.it.id); itemDrag=null; }
  if(orbit){if(ev.type!=="pointercancel"&&Math.hypot(ev.clientX-orbit.sx,ev.clientY-orbit.sy)<4&&!orbit.pan){if(orbit.keep)openEditor(orbit.itemId);else select(null);}orbit=null;}
  canvas.style.cursor="grab";
}
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("wheel", function(e){ e.preventDefault(); goalRadius=clamp(goalRadius*Math.exp(e.deltaY*0.0012),25,1000); }, { passive:false });

function afterMove(e){ applyTransform(e); keepInside(e); updateLifts(); saveItems(); updateFit(); refreshSelection(); }
function rotateSel(dir){ var e=entries[selectedId]; if(!e) return;
  if(edgeMounted(e.it)){var sides=['back','left','front','right'],r=Math.round((e.it.rot||0)/(Math.PI/2)),idx=((r+dir)%4+4)%4;e.it.mountSide=sides[idx];snapClamp(e);saveItems();updateFit();refreshSelection();return;} e.it.rot=(e.it.rot||0)+dir*Math.PI/12; afterMove(e); }
function nudgeSel(dx,dz){ var e=entries[selectedId]; if(!e) return; e.it.x+=dx; e.it.z+=dz; afterMove(e); }
function deleteItem(id){recordNow(); items=items.filter(function(x){ return x.id!==id; }); if(selectedId===id){ selectedId=null; editorOpen=false; } rebuild({ reframe:false });recordNow();toast(t("deleted"),true); }
function duplicateSel(){
  var e=entries[selectedId]; if(!e) return;
  if(items.length>=24) return;
  var c=clone(e.it); c.id=nextId++; delete c.x; delete c.z;
  if(c.kind==="monitor"||c.kind==="laptop") c.color=SCREEN_COLORS[(screenColorIdx++)%SCREEN_COLORS.length];
  items.push(c); selectedId=c.id; editorOpen=false; rebuild({ reframe:false });
}
document.querySelectorAll(".insp-actions button").forEach(function(b){
  b.addEventListener("click", function(){
    var a=b.dataset.act;
    if(a==="edit"){ editorOpen=!editorOpen; if(editorOpen) mobileReveal(); renderEditor(); }
    else if(a==="rotl") rotateSel(1); else if(a==="rotr") rotateSel(-1);
    else if(a==="focus"){if(entries[selectedId]){focusOn(entries[selectedId]);mobileReveal();}}
    else if(a==="dup") duplicateSel(); else if(a==="del") deleteItem(selectedId); else select(null);
  });
});
document.getElementById("editorClose").addEventListener("click",backToTab);
/* ---- clipboard, undo/redo actions ---- */
var clip=null, pasteN=0, toastTimer=null;
function toast(msg,undoable){
  var box=document.getElementById("toast");box.replaceChildren(el("span",null,msg));box.hidden=false;
  if(undoable){var b=el("button",null,t("undo"));b.type="button";b.onclick=undo;box.appendChild(b);}
  clearTimeout(toastTimer);toastTimer=setTimeout(function(){box.hidden=true;},undoable?6500:3000);
}

function restoreSnap(snap){
  restoring=true;
  var o=JSON.parse(snap);
  items=o.items; for(var k in o.desk) desk[k]=o.desk[k];
  nextId=items.reduce(function(m,x){ return Math.max(m,x.id||0); },0)+1;
  if(selectedId!=null && !items.some(function(x){ return x.id===selectedId; })){ selectedId=null; editorOpen=false; }
  try{ localStorage.setItem(DESK_KEY, JSON.stringify(desk)); }catch(e){}
  rebuild({ reframe:false }); renderDeskTab(); renderEditor();
  restoring=false; paintHistory();
}
function undo(){
  if(hTimer) recordNow();
  if(hIdx<=0){ toast(t("nothingUndo")); return; }
  hIdx--; restoreSnap(hist[hIdx]); toast(t("undone"));
}
function redo(){
  if(hTimer) recordNow();
  if(hIdx>=hist.length-1){ toast(t("nothingRedo")); return; }
  hIdx++; restoreSnap(hist[hIdx]); toast(t("redone"));
}
function copySel(){
  var e=entries[selectedId]; if(!e){ toast(t("selectFirst")); return false; }
  clip=clone(e.it); pasteN=0; toast(t("copied",nameOf(e.it))); return true;
}
function cutSel(){
  var e=entries[selectedId]; if(!e){ toast(t("selectFirst")); return; }
  clip=clone(e.it); pasteN=0; var n=nameOf(e.it); deleteItem(e.it.id); toast(t("cutDone",n));
}
function pasteClip(){
  if(!clip){ toast(t("nothingToPaste",MOD+"+C")); return; }
  if(items.length>=24){ toast(t("limit")); return; }
  pasteN++;
  var c=clone(clip); c.id=nextId++;
  if(c.kind==="monitor"||c.kind==="laptop") c.color=SCREEN_COLORS[(screenColorIdx++)%SCREEN_COLORS.length];
  var near=isNum(c.x)&&isNum(c.z);
  if(near){ c.x+=4*pasteN; c.z+=1.5*pasteN; }
  items.push(c); selectedId=c.id; editorOpen=false;
  rebuild({ reframe:false });
  var e=entries[c.id];
  if(e){
    keepInside(e);
    if(!near || collidesAny(e)){ delete c.x; delete c.z; autoPlace(e); }
    updateLifts(); saveItems(); refreshSelection(); updateFit(); renderList();
  }
  toast(t("pasted",nameOf(c)));
}
var helpBack=document.getElementById("helpBack");
function renderHelp(){
  var body=document.getElementById("helpBody"); body.innerHTML="";
  function keys(list){ var w=el("span","sc-keys"); list.forEach(function(k,i){ if(k==="|"){ w.appendChild(el("span",null,t("or"))); } else w.appendChild(el("kbd",null,k)); }); return w; }
  function row(desc,list){ var r=el("div","sc-row"); r.appendChild(el("span",null,desc)); r.appendChild(keys(list)); body.appendChild(r); }
  function group(title){ body.appendChild(el("div","sc-group",title)); }
  group(t("scEditing"));
  row(t("scUndo"),[MOD+"+Z"]);
  row(t("scRedo"),[MOD+"+Y","|",MOD+"+Shift+Z"]);
  row(t("scCopy"),[MOD+"+C"]); row(t("scCut"),[MOD+"+X"]); row(t("scPaste"),[MOD+"+V"]);
  row(t("scDup"),[MOD+"+D"]); row(t("scSave"),[MOD+"+S"]);
  group(t("scItem"));
  row(t("scDel"),["Delete","|","Backspace"]); row(t("scRot"),["R"]); row(t("scRotBack"),["Shift+R"]); row(t("scEdit"),["E"]);
  row(t("scMove"),[t("arrows")]); row(t("scMoveFast"),["Shift+"+t("arrows")]);
  group(t("scView"));
  row(t("scViews"),["1","2","3","4"]); row(t("scEsc"),["Esc"]); row(t("scHelp"),["?"]);
}
function openHelp(){ modalReturn=document.activeElement;renderHelp(); helpBack.hidden=false; document.getElementById("helpClose").focus(); }
function closeHelp(){helpBack.hidden=true;if(modalReturn&&modalReturn.isConnected)modalReturn.focus();}
document.getElementById("helpBtn").addEventListener("click", openHelp);
document.getElementById("helpClose").addEventListener("click", closeHelp);
helpBack.addEventListener("click", function(ev){ if(ev.target===helpBack) closeHelp(); });
document.getElementById("undoBtn").addEventListener("click", undo);
document.getElementById("redoBtn").addEventListener("click", redo);

window.addEventListener("keydown", function(ev){
  var tg=ev.target, typing=tg && (tg.tagName==="INPUT"||tg.tagName==="SELECT"||tg.tagName==="TEXTAREA"||tg.isContentEditable);
  var mod=ev.ctrlKey||ev.metaKey, code=ev.code;
  if(!helpBack.hidden){ if(code==="Escape"){ closeHelp(); ev.preventDefault(); } return; }
  if(typing) return;   /* inputs keep their own native undo, copy and paste */
  if(mod){
    if(code==="KeyZ"){ ev.preventDefault(); if(ev.shiftKey) redo(); else undo(); }
    else if(code==="KeyY"){ ev.preventDefault(); redo(); }
    else if(code==="KeyC"){ ev.preventDefault(); copySel(); }
    else if(code==="KeyX"){ ev.preventDefault(); cutSel(); }
    else if(code==="KeyV"){ ev.preventDefault(); pasteClip(); }
    else if(code==="KeyD"){ ev.preventDefault(); if(entries[selectedId]){ var n=nameOf(entries[selectedId].it); duplicateSel(); toast(t("duplicated",n)); } else toast(t("selectFirst")); }
    else if(code==="KeyS"){ev.preventDefault();if(!exportBusy)exportJSON();}
    return;
  }
  if(ev.altKey) return;
  if(ev.key==="?"||ev.key==="؟"||(code==="Slash"&&ev.shiftKey)){ ev.preventDefault(); openHelp(); return; }
  var views={ Digit1:"angle", Digit2:"front", Digit3:"top", Digit4:"side", Numpad1:"angle", Numpad2:"front", Numpad3:"top", Numpad4:"side" };
  if(views[code]){ setView(views[code]); ev.preventDefault(); return; }
  if(code==="Escape"){
    if(!exportMenu.hidden){closeExport();}
    else if(editorOpen){ editorOpen=false; renderEditor(); }
    else select(null);
    return;
  }
  if(selectedId==null) return;
  var step=(ev.shiftKey?5:1)*CM;
  if(code==="KeyR"){ rotateSel(ev.shiftKey?1:-1); ev.preventDefault(); }
  else if(code==="KeyE"){ editorOpen=!editorOpen; renderEditor(); ev.preventDefault(); }
  else if(code==="Delete"||code==="Backspace"){ deleteItem(selectedId); ev.preventDefault(); }
  else if(code==="ArrowLeft"){ nudgeSel(-step,0); ev.preventDefault(); } else if(code==="ArrowRight"){ nudgeSel(step,0); ev.preventDefault(); }
  else if(code==="ArrowUp"){ nudgeSel(0,-step); ev.preventDefault(); } else if(code==="ArrowDown"){ nudgeSel(0,step); ev.preventDefault(); }
});

/* draw only when something changed: saves battery on phones and laptops */
var lastFrameKey="";
function tick(){
  var k=0.12;
  theta+=(goalTheta-theta)*k; phi+=(goalPhi-phi)*k; radius+=(goalRadius-radius)*k; target.lerp(goalTarget,k);
  var sp=Math.sin(phi);
  camera.position.set(target.x+radius*sp*Math.sin(theta), target.y+radius*Math.cos(phi), target.z+radius*sp*Math.cos(theta));
  camera.lookAt(target);
  var fk=sceneVer+"|"+camera.position.x.toFixed(3)+","+camera.position.y.toFixed(3)+","+camera.position.z.toFixed(3)+"|"+target.x.toFixed(3)+","+target.y.toFixed(3)+","+target.z.toFixed(3);
  if(fk!==lastFrameKey){ lastFrameKey=fk; if(selHelper) selHelper.update(); renderer.render(scene,camera); }
  requestAnimationFrame(tick);
}

/* ================= field builders (shared by add form, extras & editor) ================= */
function sec(parent,title){ var s=el("div","section"); if(title) s.appendChild(el("div","section-title",title)); parent.appendChild(s); return s; }
function segCtl(parent,opts,val,onPick){
  var w=el("div","seg");
  opts.forEach(function(o){ var b=el("button",null,o[1]); b.type="button"; b.setAttribute("aria-pressed",o[0]===val?"true":"false"); b.addEventListener("click",function(){ onPick(o[0]); }); w.appendChild(b); });
  parent.appendChild(w); return w;
}
function variantCtl(parent,kind,val,onPick){
  var w=el("div","variants");
  VARIANTS[kind].forEach(function(v){
    var b=el("button"); b.type="button"; b.setAttribute("aria-pressed",v.id===val?"true":"false");
    b.appendChild(el("span",null,L(v.name))); b.appendChild(el("span","vmeta num",variantMeta(kind,v)));
    b.addEventListener("click",function(){ onPick(v.id); }); w.appendChild(b);
  });
  parent.appendChild(w);
}
function swatchCtl(parent,colors,val,onPick,square){
  var w=el("div","swatches"+(square?" square":""));
  colors.forEach(function(c){
    var hex=c.hex||c.base, b=el("button"); b.type="button"; b.style.background=hex; b.title=L(c.n); b.setAttribute("aria-label",L(c.n));
    var id=c.id||hex; b.setAttribute("aria-pressed",id===val?"true":"false");
    b.addEventListener("click",function(){ onPick(id); }); w.appendChild(b);
  });
  parent.appendChild(w);
}
function numberCtl(row,label,val,min,max,step,onVal,id){
  var f=el("div","field"),lb=el("label",null,label),inp=el("input"),error=el("span","field-error");
  inp.type="number";inp.min=min;inp.max=max;inp.step=step;inp.value=val;inp.inputMode="decimal";
  inp.id=id||"number-"+(++fieldSerial);lb.htmlFor=inp.id;error.id=inp.id+"-error";inp.setAttribute("aria-describedby",error.id);
  f.append(lb,inp,error);row.appendChild(f);
  var committed=String(val);
  inp.commit=function(){
    var v=inp.valueAsNumber,valid=Number.isFinite(v)&&v>=min&&v<=max;
    inp.setAttribute("aria-invalid",valid?"false":"true");error.textContent=valid?"":t("rangeError",min,max);
    if(valid&&inp.value!==committed){committed=inp.value;onVal(v,inp);}return valid;
  };
  inp.addEventListener("blur",inp.commit);inp.addEventListener("keydown",function(ev){if(ev.key==="Enter"){ev.preventDefault();inp.commit();}});
  inp.addEventListener("input",function(){if(inp.getAttribute("aria-invalid")==="true"){error.textContent="";inp.removeAttribute("aria-invalid");}});
  return inp;
}

function optionalNumberCtl(parent,label,val,min,max,onVal,id){
  var f=el('div','field'),lb=el('label',null,label),inp=el('input'),err=el('span','field-error');
  inp.type='number';inp.min=min;inp.max=max;inp.step='0.1';inp.inputMode='decimal';inp.value=val==null?'':val;inp.id=id||'optional-'+(++fieldSerial);lb.htmlFor=inp.id;
  err.id=inp.id+'-error';inp.setAttribute('aria-describedby',err.id);f.append(lb,inp,err);parent.appendChild(f);var prior=inp.value;
  inp.commit=function(){var v=inp.value===''?null:inp.valueAsNumber,ok=v===null||(Number.isFinite(v)&&v>=min&&v<=max);err.textContent=ok?'':t('rangeError',min,max);inp.setAttribute('aria-invalid',ok?'false':'true');if(ok&&prior!==inp.value){prior=inp.value;onVal(v);}return ok;};
  inp.addEventListener('blur',inp.commit);inp.addEventListener('keydown',function(ev){if(ev.key==='Enter'){ev.preventDefault();inp.commit();}});return inp;
}
function textCtl(parent,label,val,onVal,ph){
  var f=el("div","field"),lb=el("label",null,label),inp=el("input");inp.type="text";inp.value=val||"";inp.maxLength=60;inp.id="text-"+(++fieldSerial);lb.htmlFor=inp.id;if(ph)inp.placeholder=ph;
  f.append(lb,inp);parent.appendChild(f);inp.addEventListener("input",function(){onVal(inp.value.trim());});
}

function sliderCtl(parent,label,val,min,max,step,show,onVal){
  var w=el("div","slider"), top=el("div","top"), lb=el("span",null,label), out=el("b",null,show(val)), inp=el("input");
  inp.type="range"; inp.min=min; inp.max=max; inp.step=step; inp.value=val; inp.setAttribute("aria-label",label);
  top.appendChild(lb); top.appendChild(out); w.appendChild(top); w.appendChild(inp); parent.appendChild(w);
  var raf=null; inp.addEventListener("input",function(){ out.textContent=show(parseFloat(inp.value)); if(raf) cancelAnimationFrame(raf); raf=requestAnimationFrame(function(){ onVal(parseFloat(inp.value)); }); });
}
function ratioKey(o){ return o.ratioW+":"+o.ratioH; }

/* renderFields: builds the controls for one object.
   change(rerender) is called after each mutation; rerender=true for discrete choices */
function buildFields(parent, o, mode, change){
  parent.innerHTML="";
  var k=o.kind, edit=mode==="edit";
  if(k==="monitor"||k==="laptop"){
    var S=SCREEN[k];
    var s1=sec(parent,t("common")), chips=el("div","chips"); s1.appendChild(chips);
    S.presets.forEach(function(p){ var b=el("button",null,p[0]+'" · '+p[1]); b.type="button";
      b.addEventListener("click",function(){ o.diagonal=p[0]; var r=p[1].split(":"); o.ratioW=+r[0]; o.ratioH=+r[1]; o._custom=false; change(true); }); chips.appendChild(b); });
    var s2=sec(parent,null), row=el("div","row"); s2.appendChild(row);
    numberCtl(row,t("size"),o.diagonal,S.min,S.max,0.1,function(v,inp){ if(v>=S.min&&v<=S.max){ o.diagonal=v; inp.style.borderColor=""; change(false); } else inp.style.borderColor="var(--danger)"; });
    var f=el("div","field"), lb=el("label",null,t("ratio")), sel=el("select"); f.appendChild(lb); f.appendChild(sel); row.appendChild(f);
    var rk=ratioKey(o), known=S.ratios.indexOf(rk)>=0 && !o._custom;
    S.ratios.forEach(function(r){ var op=el("option",null,r); op.value=r; sel.appendChild(op); });
    var oc=el("option",null,t("custom")); oc.value="custom"; sel.appendChild(oc);
    sel.value=known?rk:"custom";
    sel.addEventListener("change",function(){ if(sel.value==="custom"){ o._custom=true; } else { o._custom=false; var r=sel.value.split(":"); o.ratioW=+r[0]; o.ratioH=+r[1]; } change(true); });
    if(!known){
      var row2=el("div","row"); s2.appendChild(row2);
      numberCtl(row2,t("rW"),o.ratioW,1,100,0.1,function(v){ if(v>0){ o.ratioW=v; change(false); } });
      numberCtl(row2,t("rH"),o.ratioH,1,100,0.1,function(v){ if(v>0){ o.ratioH=v; change(false); } });
    }
    if(k==="monitor"){
      var shape=sec(parent,t("screenShape"));segCtl(shape,[[false,t("flatScreen")],[true,t("curvedScreen")]],!!o.curved,function(v){o.curved=v;change(true);});
      if(o.curved)shape.appendChild(el("p","save-note",t("curveNote")));
      var s3=sec(parent,t("orient")); segCtl(s3,[[false,t("landscape")],[true,t("portrait")]],!!o.portrait,function(v){ o.portrait=v; delete o.lift; change(true); });
      var s4=sec(parent,t("mount")); segCtl(s4,[["stand",t("mStand")],["arm",t("mArm")]],o.mount||"stand",function(v){ o.mount=v; change(true); });
      if(edit){
        var s5=sec(parent,null), cur=isNum(o.lift)?o.lift:monitorDefaultLift(o), mx=o.mount==="arm"?20:14, mn=o.mount==="arm"?1:2.5;
        sliderCtl(s5,t("scrH"),clamp(cur,mn,mx),mn,mx,0.2,function(v){ return toCm(v)+" "+t("cm"); },function(v){ o.lift=v; change(false); });
      }
    } else {
      var s6=sec(parent,t("lapStand")); segCtl(s6,[[false,t("none")],[true,t("onStand")]],!!o.stand,function(v){ o.stand=v; change(true); });
    }
    if(edit){ var s7=sec(parent,t("scrColor")); swatchCtl(s7,SCREEN_COLORS.map(function(h){ return { hex:h, n:{ar:h,en:h} }; }),o.color,function(v){ o.color=v; change(true); }); }
    var s8=sec(parent,null); textCtl(s8,t("name"),o.name,function(v){ o.name=cleanName(v); change(false); });
    return;
  }
  if(k==="custom"){
    var sn=sec(parent,null); textCtl(sn,t("customName"),o.name,function(v){ o.name=cleanName(v); change(false); },t("customPh"));
    var sd=sec(parent,null), rowA=el("div","row"); sd.appendChild(rowA);
    [["w","cw",1,300],["d","cd",1,200],["h","ch",0.5,300]].forEach(function(f){
      numberCtl(rowA,t(f[1]),o[f[0]],f[2],f[3],0.5,function(v,inp){ if(v>=f[2]&&v<=f[3]){ o[f[0]]=Math.round(v*10)/10; inp.style.borderColor=""; change(false); } else inp.style.borderColor="var(--danger)"; });
    });
    var spl=sec(parent,t("place")); segCtl(spl,[["desk",t("onDesk")],["floor",t("onFloor")]],o.place||"desk",function(v){ if(o.place!==v){ o.place=v; if(edit){ delete o.x; delete o.z; } } change(true); });
    var scc=sec(parent,t("color")); swatchCtl(scc,ACC_COLORS,o.color,function(v){ o.color=v; change(true); });
    return;
  }
  var sv=sec(parent,t("model"));
  variantCtl(sv,k,o.variant||VARIANTS[k][0].id,function(v){
    o.variant=v;
    if(k==="chair"){ delete o.seatH; o.scale=1; }
    if((k==="micArm"||k==="headphones"||k==="plant") && edit){ delete o.x; delete o.z; }
    change(true);
  });
  if(k==="pc"){
    var sp=sec(parent,t("place")); segCtl(sp,[["floor",t("onFloor")],["desk",t("onDesk")]],o.place||"floor",function(v){ if(o.place!==v){ o.place=v; if(edit){ delete o.x; delete o.z; } } change(true); });
  }
  var cols=itemColors(o);
  var sc=sec(parent,t("color")); swatchCtl(sc,cols,o.color,function(v){ o.color=v; change(true); });
  if(k==="plant"){ var sz=sec(parent,t("plantSize")); segCtl(sz,PLANT_SIZES,plantScale(o),function(v){ o.size=v; change(true); }); }
  if(k==="pc"){
    var sr=sec(parent,t("rgb")); segCtl(sr,[[false,t("off")],[true,t("on")]],!!o.rgb,function(v){ o.rgb=v; change(true); });
    if(o.rgb){ var sr2=sec(parent,t("rgbColor")); swatchCtl(sr2,RGB_COLORS,o.rgbColor||"#35d3ff",function(v){ o.rgbColor=v; change(true); }); }
  }
  if(k==="chair"){
    var cs=chairSpec(o), sch=sec(parent,null);
    sliderCtl(sch,t("seatH"),cs.seatH,38*CM,62*CM,0.1,function(v){ return toCm(v)+" "+t("cm"); },function(v){ o.seatH=v; change(false); });
    var sch2=sec(parent,null);
    sliderCtl(sch2,t("chairSize"),isNum(o.scale)?o.scale:1,0.85,1.2,0.01,function(v){ return Math.round(v*100)+"%"; },function(v){ o.scale=v; change(false); });
  }
}

var fieldSerial=0, changingField=false;
function renderFields(parent,o,mode,change){
  var expanded=!!parent.querySelector("details[open]"), scroll=parent.parentElement.scrollTop;
  buildFields(parent,o,mode,change);
  if(edgeMounted(o)){
    var ms=sec(parent,t('edgeMount')),f=el('div','field'),select=el('select');select.setAttribute('aria-label',t('edgeMount'));
    [['auto','edgeAuto'],['back','edgeBack'],['front','edgeFront'],['left','edgeLeft'],['right','edgeRight']].forEach(function(pair){var op=el('option',null,t(pair[1]));op.value=pair[0];select.appendChild(op);});
    select.value=o.mountSide||'auto';select.addEventListener('change',function(){o.mountSide=select.value;change(true);});f.appendChild(select);ms.appendChild(f);ms.appendChild(el('p','save-note',t('edgeHint')));
  }
  var ws=sec(parent,t('weightDetails')),wr=el('div','row');ws.appendChild(wr);
  optionalNumberCtl(wr,t('weightKg'),itemWeight(o),0,500,function(v){o.weightKg=v;change(false);},'weight-'+mode);
  ws.appendChild(el('p','save-note',t(itemWeight(o)===null?'weightUnknownItem':'weightHint')));
  var reset=el('button','btn-ghost',t('weightReset'));reset.type='button';reset.onclick=function(){delete o.weightKg;change(true);};ws.appendChild(reset);
  var details=el("details","appearance"); details.open=expanded; details.appendChild(el("summary",null,t("appearance")));
  Array.from(parent.children).forEach(function(section){
    var heading=section.querySelector(".section-title"), text=heading?heading.textContent:"";
    if(section.querySelector('.swatches,input[type=text]') || text===t("rgb")) details.appendChild(section);
  });
  if(details.children.length>1) parent.appendChild(details);
  parent.querySelectorAll(".field").forEach(function(f){ var label=f.querySelector("label"), control=f.querySelector("input,select"); if(label&&control){if(!control.id)control.id="field-"+(++fieldSerial);label.htmlFor=control.id;} });
  parent.parentElement.scrollTop=scroll;
}
function openEditor(id){
  if(!entries[id]) return;
  selectedId=id;editorOpen=true;refreshSelection();renderList();if(isMobile())setPanel(true);
}
function backToTab(){editorOpen=false;renderEditor();document.getElementById(activeTab||"tab-add").focus();}
/* ================= editor ================= */
function renderEditor(){
  var card=document.getElementById("editor"),e=entries[selectedId];
  var open=!!(editorOpen&&e);card.hidden=!open;document.getElementById("panel").classList.toggle("editing",open);
  if(!open||changingField)return;
  document.getElementById("editorTitle").textContent=nameOf(e.it);
  var id=e.it.id;
  renderFields(document.getElementById("editorFields"),e.it,"edit",function(rerender){
    changingField=true;try{rebuildOne(id);}finally{changingField=false;}
    document.getElementById("editorTitle").textContent=nameOf(entries[id].it);
    if(rerender)renderEditor();
  });
}
/* ================= add tab & extras ================= */
var drafts={
  monitor:{ kind:"monitor", diagonal:27, ratioW:16, ratioH:9, portrait:false, mount:"stand", name:"" },
  laptop:{ kind:"laptop", diagonal:14, ratioW:16, ratioH:10, stand:false, name:"" },
  pc:{ kind:"pc", variant:"mid", place:"floor", color:"#1f2023", rgb:true, rgbColor:"#35d3ff" },
  keyboard:{ kind:"keyboard", variant:"tkl", color:"#1f2023" },
  mouse:{ kind:"mouse", variant:"std", color:"#1f2023" },
  mousepad:{ kind:"mousepad", variant:"l", color:"#1f2023" },
  chair:{ kind:"chair", variant:"ergo", color:"#1f2023", scale:1 },
  riser:{ kind:"riser", variant:"single", color:"#a87b50" },
  mic:{ kind:"mic", variant:"desk", color:"#1f2023" },
  micArm:{ kind:"micArm", variant:"boom", color:"#1f2023" },
  headphones:{ kind:"headphones", variant:"stand", color:"#1f2023" },
  plant:{ kind:"plant", variant:"leafy", color:"#b8653f", size:1 },
  custom:{ kind:"custom", name:"", w:30, d:20, h:15, place:"desk", color:"#8a8e95" }
};
var addKind="monitor", extraKind="riser";
function kindGridRender(gridEl, kinds, cur, onPick){
  gridEl.innerHTML="";
  kinds.forEach(function(k){
    var b=el("button"); b.type="button"; b.setAttribute("aria-pressed",k===cur?"true":"false");
    b.innerHTML=icon(k)+"<span></span>"; b.lastChild.textContent=L(KINDS[k].name);
    b.addEventListener("click",function(){ onPick(k); }); gridEl.appendChild(b);
  });
}
function addButtonLabel(d){return t("addNamed",L(KINDS[d.kind].name));}
function renderAdd(){
  kindGridRender(document.getElementById("kindGrid"), MAIN_KINDS, addKind, function(k){ addKind=k; document.getElementById("addErr").textContent=""; renderAdd(); });
  kindGridRender(document.getElementById("extraGrid"), EXTRA_KINDS, addKind, function(k){addKind=k;document.getElementById("addErr").textContent="";renderAdd();});
  var d=drafts[addKind];
  renderFields(document.getElementById("addFields"), d, "add", function(rerender){ if(rerender) renderAdd(); else document.getElementById("addBtn").textContent=addButtonLabel(d); });
  document.getElementById("addBtn").textContent=addButtonLabel(d);
}

function addFromDraft(d, errEl){
  var valid=true;document.querySelectorAll("#addFields input[type=number]").forEach(function(inp){if(inp.commit&&!inp.commit()){valid=false;inp.focus();}});if(!valid)return;
  if(items.length>=24){ errEl.textContent=t("limit"); return; }
  if(d.kind==="monitor"||d.kind==="laptop"){
    var S=SCREEN[d.kind];
    if(!(d.diagonal>=S.min && d.diagonal<=S.max)){ errEl.textContent=t("sizeRange",S.min,S.max); return; }
    if(!(d.ratioW>0 && d.ratioH>0)){ errEl.textContent=t("badRatio"); return; }
  }
  var it=clone(d); delete it._custom; it.id=nextId++;
  if(it.kind==="monitor"||it.kind==="laptop") it.color=SCREEN_COLORS[(screenColorIdx++)%SCREEN_COLORS.length];
  if(d.name) d.name="";
  items.push(it); selectedId=it.id; editorOpen=false; errEl.textContent="";
  rebuild({ reframe:false });
  var e=entries[it.id]; if(e && !onDesk(e)) errEl.textContent=t("noRoom");
  if(errEl.id==="addErr") mobileReveal();
  renderAdd();toast(t("addedNamed",nameOf(it)));
}
document.getElementById("addBtn").addEventListener("click", function(){ addFromDraft(drafts[addKind], document.getElementById("addErr")); });

/* ================= tabs ================= */
var activeTab="tab-desk";
var TABS=[["tab-add","p-add"],["tab-items","p-items"],["tab-desk","p-desk"]];
function showTab(id){
  activeTab=id;editorOpen=false;renderEditor();
  TABS.forEach(function(p){ var on=p[0]===id,button=document.getElementById(p[0]),page=document.getElementById(p[1]);button.setAttribute("aria-selected",on?"true":"false");button.tabIndex=on?0:-1;page.setAttribute("aria-labelledby",p[0]);page.hidden=!on; });
  document.getElementById("addFoot").hidden=id!=="tab-add";
}
TABS.forEach(function(p){ document.getElementById(p[0]).addEventListener("click", function(){ showTab(p[0]); }); });
document.querySelector('.tabs').addEventListener('keydown',function(ev){
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(ev.key))return;
  ev.preventDefault();ev.stopPropagation();
  var order=['tab-desk','tab-add','tab-items'],i=order.indexOf(activeTab),step=(ev.key==='ArrowRight'?1:-1)*(settings.lang==='ar'?-1:1);
  i=ev.key==='Home'?0:ev.key==='End'?2:(i+step+3)%3;showTab(order[i]);document.getElementById(order[i]).focus();
});

/* ================= list tab ================= */
function renderList(){
  var list=document.getElementById("itemList"); list.innerHTML="";
  document.getElementById("itemCount").textContent=items.length;
  document.getElementById("listActions").hidden=!items.length;
  if(!items.length){ list.appendChild(el("div","empty",t("emptyDesk"))); return; }
  items.slice().sort(function(a,b){ return KINDS[a.kind].order-KINDS[b.kind].order; }).forEach(function(it){
    var row=el("div","item"+(it.id===selectedId?" sel":""));row.tabIndex=0;row.setAttribute("role","button");row.setAttribute("aria-label",t("edit")+" "+nameOf(it));row.addEventListener("keydown",function(ev){if(ev.target===row&&(ev.key==="Enter"||ev.key===" ")){ev.preventDefault();openEditor(it.id);}});
    var ic=el("div","ic"); ic.innerHTML=icon(it.kind);
    ic.style.color=(it.kind==="monitor"||it.kind==="laptop")?it.color:(it.kind==="pc"&&it.rgb?it.rgbColor:"var(--ink-soft)");
    var txt=el("div","txt"); txt.appendChild(el("div","t1",nameOf(it)));
    var e=entries[it.id], off=e&&e.placed&&!onDesk(e), clash=clashLabel(it.id);
    var t2=el("div","t2"+((off||clash)?" bad":""), metaOf(it)+(off?" · "+t("outside"):"")+(clash?" · "+t("hitsWith",clash):""));
    txt.appendChild(t2);
    var rm=el("button","rm","×"); rm.type="button"; rm.setAttribute("aria-label",t("del")+" "+nameOf(it));
    rm.addEventListener("click",function(ev){ ev.stopPropagation(); deleteItem(it.id); });
    row.addEventListener("click",function(){openEditor(it.id);});
    row.appendChild(ic); row.appendChild(txt); row.appendChild(rm); list.appendChild(row);
  });
}
document.getElementById("arrangeBtn").addEventListener("click", function(){recordNow();items.forEach(function(it){delete it.x;delete it.z;it.rot=0;});rebuild();recordNow();toast(t("arrange"),true);});
var clearArmed=false, clearBtn=document.getElementById("clearBtn");
clearBtn.addEventListener("click",function(){
  if(!window.confirm(t("clearConfirm")))return;recordNow();items=[];selectedId=null;editorOpen=false;rebuild();recordNow();toast(t("clearAll"),true);
});

/* ================= desk tab ================= */
var DESK_PRESETS=[
  ["presetSmall",{ shape:"rect", w:100, d:60, h:75 }], ["presetStd",{ shape:"rect", w:140, d:70, h:75 }], ["presetBig",{ shape:"rect", w:180, d:80, h:75 }],
  ["presetStand",{ shape:"rect", w:140, d:70, h:110 }], ["presetL",{ shape:"lRight", w:160, d:70, h:75, rl:140, rd:60 }]
];
function applyDesk(){ saveDesk(); rebuild({ contain:true }); }
function renderDeskTab(){
  var p=document.getElementById("deskFields"); p.innerHTML="";
  var s1=sec(p,t("deskShape"));
  segCtl(s1,[["rect",t("rect")],["lRight",t("lRight")],["lLeft",t("lLeft")]],desk.shape,function(v){ desk.shape=v; applyDesk(); renderDeskTab(); });
  var s2=sec(p,t("dims")), r1=el("div","row"); s2.appendChild(r1);
  var err=el("div","error"); err.setAttribute("role","alert");
  function setDim(key,v,min,max){
    if(!(v>=min && v<=max)){ err.textContent=t("deskRange"); return; }
    desk[key]=Math.round(v);
    if(desk.rl<desk.d+20) desk.rl=desk.d+20;
    if(desk.rd>desk.w-20) desk.rd=desk.w-20;
    err.textContent=""; applyDesk();
  }
  numberCtl(r1,t("width"),desk.w,60,400,1,function(v){ setDim("w",v,60,400); });
  numberCtl(r1,t("depth"),desk.d,40,150,1,function(v){ setDim("d",v,40,150); });
  numberCtl(r1,t("height"),desk.h,40,130,1,function(v){ setDim("h",v,40,130); });
  if(desk.shape!=="rect"){
    var r2=el("div","row"); s2.appendChild(r2);
    numberCtl(r2,t("retLen"),desk.rl,desk.d+20,320,1,function(v){ setDim("rl",v,desk.d+20,320); });
    numberCtl(r2,t("retDepth"),desk.rd,35,Math.min(150,desk.w-20),1,function(v){ setDim("rd",v,35,Math.min(150,desk.w-20)); });
  }
  var thicknessRow=el('div','row');s2.appendChild(thicknessRow);
  numberCtl(thicknessRow,t('thickness'),desk.thickness,0.5,15,0.1,function(v){desk.thickness=Math.round(v*10)/10;applyDesk();},'desk-thickness');
  s2.appendChild(err);
  var loadSection=sec(p,t('weightTitle')),capacityRow=el('div','row');loadSection.appendChild(capacityRow);
  optionalNumberCtl(capacityRow,t('capacity'),desk.capacity,0.1,2000,function(v){desk.capacity=v;saveDesk();updateFit();},'desk-capacity');
  loadSection.appendChild(el('p','save-note',t('capacityHint')));
  var loadBox=el('div','fit');loadBox.id='loadSummary';loadBox.setAttribute('aria-live','polite');loadSection.appendChild(loadBox);
  loadSection.appendChild(el('p','save-note',t('loadNote')));
  var s3=sec(p,t("deskColor")); swatchCtl(s3,DESK_COLORS,desk.color,function(v){ desk.color=v; applyDesk(); renderDeskTab(); },true);
  var sl=sec(p,t("legs")), vl=el("div","variants"); sl.appendChild(vl);
  LEG_STYLES.forEach(function(ls){
    var b=el("button"); b.type="button"; b.setAttribute("aria-pressed",ls.id===(desk.legs||"four")?"true":"false");
    b.appendChild(el("span",null,L(ls.n))); b.appendChild(el("span","vmeta",L(ls.d)));
    b.addEventListener("click",function(){ desk.legs=ls.id; applyDesk(); renderDeskTab(); }); vl.appendChild(b);
  });
  var slc=sec(p,t("legColor")); swatchCtl(slc,LEG_COLORS.map(function(c){ return c.id==="wood" ? { id:c.id, hex:(DESK_COLORS.filter(function(d){ return d.id===desk.color; })[0]||DESK_COLORS[0]).base, n:c.n } : c; }),desk.legColor||"black",function(v){ desk.legColor=v; applyDesk(); renderDeskTab(); },true);
  var s4=sec(p,t("common")), ch=el("div","chips text"); s4.appendChild(ch);
  DESK_PRESETS.forEach(function(pr){ var b=el("button",null,t(pr[0])); b.type="button";
    b.addEventListener("click",function(){ for(var k in pr[1]) desk[k]=pr[1][k]; if(desk.rl<desk.d+20) desk.rl=desk.d+40; applyDesk(); renderDeskTab(); }); ch.appendChild(b); });
  var s5=sec(p,t("fitTitle")), fit=el("div","fit"); fit.id="fitNote"; s5.appendChild(fit);
  updateFit();
}
function deskLabel(){ return desk.shape==="rect" ? dims(desk.w,desk.d)+" "+t("cm") : "L "+dims(desk.w,desk.rl)+" "+t("cm"); }
var clashWith={}, warnTarget=null;
function clashLabel(id){
  var p=clashWith[id]; if(p==null) return "";
  if(typeof p==="string" && p.indexOf("desk:")===0) return obstacleName(p.slice(5));
  return entries[p] ? nameOf(entries[p].it) : "";
}
function focusOn(e){
  var b=worldBox(e), c=b.getCenter(V(0,0,0)), sz=b.getSize(V(0,0,0));
  goalTarget.copy(c); goalRadius=clamp(Math.max(sz.x,sz.y,sz.z)*4+30, 45, goalRadius);
}
function updateFit(){
  var out=[], pairs=[], list=[];
  clashWith={}; warnTarget=null;
  eachEntry(function(e){ if(!e.placed) return; list.push(e); if(!onDesk(e)){ out.push(nameOf(e.it)); if(warnTarget==null) warnTarget=e.it.id; } });
  for(var i=0;i<list.length;i++) for(var j=i+1;j<list.length;j++){
    if(collides(list[i],list[j])){ pairs.push([list[i],list[j]]); if(clashWith[list[i].it.id]==null) clashWith[list[i].it.id]=list[j].it.id; if(clashWith[list[j].it.id]==null) clashWith[list[j].it.id]=list[i].it.id; }
  }
  /* items running into the desk's legs, frame, brackets or the wall */
  list.forEach(function(e){
    var tag=deskHit(e); if(!tag) return;
    pairs.push([e,null,tag]); if(clashWith[e.it.id]==null) clashWith[e.it.id]="desk:"+tag;
  });
  var msgs=[],load=deskLoad();renderLoad();
  if(load.level!=="normal")msgs.push(loadMessage(load));
  if(out.length) msgs.push(out.length===1?t("outOne",out[0]):t("outMany",out.length));
  if(pairs.length){
    var pk=pairs[0];
    if(selectedId!=null){ for(var q=0;q<pairs.length;q++){ if(pairs[q][0].it.id===selectedId||(pairs[q][1]&&pairs[q][1].it.id===selectedId)){ pk=pairs[q]; break; } } }
    var a=pk[0], m=t("ovPair",nameOf(a.it),pk[1]?nameOf(pk[1].it):obstacleName(pk[2])); if(pairs.length>1) m+=" "+t("ovMore",pairs.length-1);
    warnTarget=a.it.id;
    msgs.push(m);
  }
  var chip=document.getElementById("warnChip"), fit=document.getElementById("fitNote");
  if(msgs.length){ chip.hidden=false; chip.textContent=msgs.join(" · "); } else chip.hidden=true;
  if(fit){
    if(msgs.length){ fit.className="fit bad"; fit.textContent=msgs.join("، ")+". "+t("fitFix"); }
    else { fit.className="fit"; fit.textContent=items.length?t("fitOk",deskLabel(),desk.h):t("fitEmpty"); }
  }
  renderList();
}

document.getElementById("warnChip").addEventListener("click", function(){
  if(warnTarget!=null && entries[warnTarget]){ openEditor(warnTarget); }
});

/* ================= theme & language ================= */
var themeBtn=document.getElementById("themeBtn"), langBtn=document.getElementById("langBtn");
function paintToggles(){
  var dark=settings.theme==="dark";
  themeBtn.innerHTML=dark?SUN:MOON; themeBtn.title=dark?t("themeToLight"):t("themeToDark"); themeBtn.setAttribute("aria-label",themeBtn.title);
  langBtn.textContent=settings.lang==="ar"?"EN":"ع"; langBtn.title=t("langTitle"); langBtn.setAttribute("aria-label",t("langTitle"));
}
function applyStatic(){
  var ar=settings.lang==="ar";
  document.documentElement.lang=ar?"ar":"en"; document.documentElement.dir=ar?"rtl":"ltr";
  document.title=t("appTitle");
  document.querySelectorAll("[data-i18n]").forEach(function(n){ n.textContent=t(n.getAttribute("data-i18n")); });
  document.querySelectorAll("[data-i18n-aria]").forEach(function(n){ var s=t(n.getAttribute("data-i18n-aria")); n.setAttribute("aria-label",s); n.title=s; });
  document.getElementById("hint").textContent=t(isMobile()?"touchHint":"shortHint");
  document.getElementById("sheetState").textContent=t(document.getElementById("panel").classList.contains("collapsed")?"expand":"collapse");
  document.getElementById("undoBtn").title=t("undo")+" ("+MOD+"+Z)"; document.getElementById("undoBtn").setAttribute("aria-label",t("undo"));
  document.getElementById("redoBtn").title=t("redo")+" ("+MOD+"+Y)"; document.getElementById("redoBtn").setAttribute("aria-label",t("redo"));
  document.getElementById("helpBtn").title=t("shortcuts")+" (?)"; document.getElementById("helpBtn").setAttribute("aria-label",t("shortcuts"));
  if(!document.getElementById("helpBack").hidden) renderHelp();
  clearBtn.textContent=t("clearAll");
  paintToggles();
}
themeBtn.addEventListener("click", function(){
  settings.theme=settings.theme==="dark"?"light":"dark"; saveSettings();
  document.documentElement.setAttribute("data-theme",settings.theme);
  applyScenePalette(); paintToggles(); rebuild({ reframe:false });
});
function fontsReady(){
  if(!document.fonts || !document.fonts.load) return Promise.resolve();
  var sample="Monitor Laptop 0123456789 شاشة لابتوب عنصر";
  return Promise.all([400,500,600,700].map(function(w){ return document.fonts.load(w+" 32px Cairo",sample); }))
    .then(function(){ return document.fonts.ready; }).catch(function(){});
}
langBtn.addEventListener("click", function(){
  settings.lang=settings.lang==="ar"?"en":"ar"; saveSettings();
  applyStatic();renderAdd();renderDeskTab();resize();
  rebuild({ reframe:false });                       /* textures redrawn now in the new language */
  fontsReady().then(function(){ rebuild({ reframe:false }); });   /* and again once glyphs for it are loaded */
});


/* ================= export & import ================= */
var dl=null, dlMode="anchor";
if(window.claude && typeof window.claude.use==="function"){
  dlMode="pending";
  window.claude.use("downloads").then(function(ns){ dl=ns; dlMode=ns?"cap":"none"; paintExport(); }).catch(function(){ dlMode="none"; paintExport(); });
}
var exportBtn=document.getElementById("exportBtn"), exportMenu=document.getElementById("exportMenu"), expStatus=document.getElementById("expStatus"), importInput=document.getElementById("importInput");
var exportKind="png",exportBusy=false,modalReturn=null;
function paintExport(){
  exportMenu.querySelectorAll("[data-exp]").forEach(function(b){b.setAttribute("aria-pressed",b.dataset.exp===exportKind?"true":"false");b.disabled=exportBusy;});
  exportMenu.querySelectorAll('[data-res]').forEach(function(b){b.disabled=exportBusy;});
  document.getElementById("resRow").hidden=exportKind!=="png";
  document.getElementById("downloadBtn").disabled=exportBusy||dlMode==="none"||dlMode==="pending";
  document.getElementById("downloadBtn").textContent=t(exportBusy?"preparing":"download");
  exportMenu.setAttribute("aria-busy",exportBusy?"true":"false");
}
function status(msg){expStatus.textContent=msg||"";if(msg&&msg!==t("preparing")){exportBusy=false;paintExport();}if(msg&&exportMenu.hidden)toast(msg);}
function closeExport(){exportMenu.hidden=true;document.getElementById("exportBack").hidden=true;exportBtn.setAttribute("aria-expanded","false");if(modalReturn&&modalReturn.isConnected)modalReturn.focus();}
exportBtn.addEventListener("click",function(){modalReturn=document.activeElement;exportMenu.hidden=false;document.getElementById("exportBack").hidden=false;exportBtn.setAttribute("aria-expanded","true");paintExport();document.getElementById("exportClose").focus();});
document.getElementById("exportClose").onclick=closeExport;
document.getElementById("exportBack").onclick=function(ev){if(ev.target===this)closeExport();};
document.getElementById("downloadBtn").onclick=function(){
 if(exportBusy)return;exportBusy=true;paintExport();status(t("preparing"));
 setTimeout(function(){try{if(exportKind==="png")exportClean();else if(exportKind==="report")exportReport();else if(exportKind==="xlsx")exportExcel();else exportJSON();}catch(_){status(t("exportFail"));}},50);
};
document.addEventListener("keydown",function(ev){
 var modal=!exportMenu.hidden?exportMenu:(!helpBack.hidden?helpBack:null);if(!modal)return;
 if(ev.key==="Escape"){ev.preventDefault();ev.stopImmediatePropagation();if(modal===exportMenu)closeExport();else closeHelp();return;}
 if(ev.key==="Tab"){
  var controls=Array.from(modal.querySelectorAll('button:not(:disabled),input:not([hidden]),select,[tabindex="0"]')).filter(function(n){return !n.closest('[hidden]');});
  var first=controls[0],last=controls[controls.length-1];
  if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
 }
 ev.stopPropagation();
},true);

function saveFile(filename, data){
  if(dlMode==="cap" && dl){
    dl.save({ filename:filename, data:data }).then(function(){ status(t("saved")); }).catch(function(err){
      var c=err&&err.code;
      if(c==="declined") status(t("declined")); else if(c==="rate_limited") status(t("busy"));
      else { status(t("noExport")); if(c==="unavailable"||c==="not_granted"||c==="capability_disabled"||c==="capability_removed"){ dlMode="none"; paintExport(); } }
    });
    return;
  }
  if(dlMode==="anchor"){
    try{
      var blob=data instanceof Blob?data:new Blob([data],{ type:"application/octet-stream" }), url=URL.createObjectURL(blob), a=document.createElement("a");
      a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(url); },5000);
      status(t("started"));
    }catch(e){ status(t("noExport")); }
    return;
  }
  status(t("noExport"));
}
function itemDims(e,plain){ var s=e.size, a=Math.max(1,toCm(s.x)), b=Math.max(1,toCm(s.z)), c=Math.max(1,toCm(s.y)); return plain ? a+"×"+b+"×"+c : dims(a,b,c); }
function modelOf(it){
  if(it.kind==="monitor"||it.kind==="laptop") return fmt(it.diagonal)+'" '+it.ratioW+":"+it.ratioH+(it.curved?" · "+t("curvedScreen"):"");
  if(it.kind==="custom") return L(KINDS.custom.name);
  var m=L(variantOf(it).name); if(it.kind==="plant" && plantScale(it)!==1) m+=" · "+Math.round(plantScale(it)*100)+"%"; return m;
}
function deskSummary(){
  var ls=LEG_STYLES.filter(function(x){ return x.id===(desk.legs||"four"); })[0], dc=DESK_COLORS.filter(function(c){ return c.id===desk.color; })[0];
  return t("deskLine",deskLabel(),desk.h)+" · "+L(dc?dc.n:DESK_COLORS[0].n)+" · "+L(ls?ls.n:LEG_STYLES[0].n);
}
function sortedEntries(){ return items.slice().sort(function(a,b){ return KINDS[a.kind].order-KINDS[b.kind].order; }).map(function(it){ return entries[it.id]; }).filter(Boolean); }
function dateStamp(){ var d=new Date(); return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2); }
function fileName(kind,ext){ return "desk-setup"+(kind?"-"+kind:"")+"-"+dateStamp()+"."+ext; }
/* everything worth showing: desk (down to the floor) and all items */
function sceneBox(){
  var bb=deskBounds(), b=new THREE.Box3();
  b.expandByPoint(V(bb.x0,0,bb.z0)); b.expandByPoint(V(bb.x1,DESK_H,bb.z1));
  eachEntry(function(e){ b.union(worldBox(e)); });
  return b;
}
/* camera target + distance that fit the whole setup, centred, for a given angle and aspect */
function boxCorners(b,pts){ [b.min.x,b.max.x].forEach(function(x){ [b.min.y,b.max.y].forEach(function(y){ [b.min.z,b.max.z].forEach(function(z){ pts.push(V(x,y,z)); }); }); }); }
function framePoints(){
  /* the real solid parts (not one loose box), so exports fill the frame */
  var pts=[];
  deskRects().forEach(function(r){ boxCorners({ min:{ x:r.x0, y:DESK_H-DESK_TOP, z:r.z0 }, max:{ x:r.x1, y:DESK_H, z:r.z1 } },pts); });
  deskObstacles.forEach(function(o){ if(o.tag!=="wall") boxCorners(o.b,pts); });
  eachEntry(function(e){ worldParts(e).forEach(function(p){ boxCorners(p,pts); }); });
  return pts;
}
function frameFor(th,ph,aspect,margin){
  var b=sceneBox(), pts=framePoints();
  var dir=V(Math.sin(ph)*Math.sin(th),Math.cos(ph),Math.sin(ph)*Math.cos(th)).normalize();
  var right=new THREE.Vector3().crossVectors(V(0,1,0),dir).normalize(), up=new THREE.Vector3().crossVectors(dir,right).normalize();
  var tv=Math.tan(camera.fov*Math.PI/360)*(1-margin), th2=tv*aspect, center=b.getCenter(V(0,0,0)), D=0, v=V(0,0,0);
  function solve(){ D=0; pts.forEach(function(p){ v.subVectors(p,center); var z=v.dot(dir); D=Math.max(D,Math.abs(v.dot(right))/th2+z,Math.abs(v.dot(up))/tv+z); }); }
  solve();
  for(var it=0;it<3;it++){
    var mnx=1e9,mxx=-1e9,mny=1e9,mxy=-1e9;
    pts.forEach(function(p){ v.subVectors(p,center); var dep=D-v.dot(dir), sx=v.dot(right)/(dep*th2), sy=v.dot(up)/(dep*tv); mnx=Math.min(mnx,sx); mxx=Math.max(mxx,sx); mny=Math.min(mny,sy); mxy=Math.max(mxy,sy); });
    center.addScaledVector(right,(mnx+mxx)/2*D*th2).addScaledVector(up,(mny+mxy)/2*D*tv);
    solve();
  }
  return { target:center, dist:D, dir:dir };
}
/* render several stills without touching the user's view: size, pixel ratio and camera are restored exactly */
function captureShots(specs){
  var gl=renderer.getContext(), mv=gl.getParameter(gl.MAX_VIEWPORT_DIMS), limit=Math.min(mv[0],mv[1],gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)||4096);
  var saved={ pr:renderer.getPixelRatio(), pos:camera.position.clone(), quat:camera.quaternion.clone(), helper:selHelper?selHelper.visible:false };
  if(selHelper) selHelper.visible=false;
  var outs=[];
  try{
    renderer.setPixelRatio(1); camera.clearViewOffset();
    specs.forEach(function(sp){
      var f=Math.min(1,limit/Math.max(sp.w,sp.h)), rw=Math.round(sp.w*f), rh=Math.round(sp.h*f);
      renderer.setSize(rw,rh,false); camera.aspect=rw/rh; camera.updateProjectionMatrix();
      var fr=frameFor(sp.theta,sp.phi,camera.aspect,sp.margin==null?0.08:sp.margin);
      camera.position.copy(fr.target).addScaledVector(fr.dir,fr.dist); camera.lookAt(fr.target);
      renderer.render(scene,camera);
      var c=document.createElement("canvas"); c.width=sp.w; c.height=sp.h;
      var cx=c.getContext("2d"); cx.imageSmoothingQuality="high"; cx.drawImage(renderer.domElement,0,0,rw,rh,0,0,sp.w,sp.h);
      outs.push(c);
    });
  } finally {
    renderer.setPixelRatio(saved.pr);
    if(selHelper) selHelper.visible=saved.helper;
    resize();
    camera.position.copy(saved.pos); camera.quaternion.copy(saved.quat); camera.updateMatrixWorld();
    renderer.render(scene,camera); lastFrameKey=""; bump();
  }
  return outs;
}
function themeInk(){
  var d=settings.theme==="dark";
  return { bg:d?"#29313c":"#e8edf2", card:d?"#252e3b":"#ffffff", panel:d?"#1e2530":"#f7f9fc", ink:d?"#edf2f8":"#243042", soft:d?"#b5c0ce":"#566477",
           faint:d?"#99a6b7":"#667588", line:d?"rgba(236,233,224,0.12)":"rgba(34,31,24,0.12)", acc:d?"#8eaae3":"#2e4f86", accInk:d?"#10141b":"#f6f3ec" };
}
var FONT="'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif";
function fnt(w,px){ return w+" "+px+"px "+FONT; }
function fitText(g,text,maxW){
  text=String(text); if(g.measureText(text).width<=maxW) return text;
  while(text.length>1 && g.measureText(text+"…").width>maxW) text=text.slice(0,-1);
  return text+"…";
}
function rrect(g,x,y,w,h,r){ roundRect(g,x,y,w,h,Math.min(r,w/2,h/2)); }
function toPng(canvas,name){
  canvas.toBlob(function(blob){ if(blob) saveFile(name,blob); else status(t("exportFail")); },"image/png");
}
var exportRes=2560;
function exportClean(){
  status(t("preparing"));
  fontsReady().then(function(){
    try{
      var W=exportRes, H=Math.round(exportRes*9/16), rtl=settings.lang==="ar", c0=themeInk();
      var shot=captureShots([{ w:W, h:H, theta:theta, phi:Math.max(phi,0.1), margin:0.1 }])[0];
      var g=shot.getContext("2d"), fs=Math.round(H*0.017), pad=Math.round(H*0.028), label=t("appTitle");
      g.font=fnt(600,fs); g.direction=rtl?"rtl":"ltr";
      var tw=g.measureText(label).width, bw=tw+fs*1.6, bh=fs*2, bx=rtl?pad:W-pad-bw, by=H-pad-bh;
      g.globalAlpha=0.78; g.fillStyle=c0.panel; rrect(g,bx,by,bw,bh,bh/2); g.fill(); g.globalAlpha=1;
      g.fillStyle=c0.soft; g.textAlign="center"; g.textBaseline="middle"; g.fillText(label,bx+bw/2,by+bh/2+fs*0.05);
      toPng(shot,fileName("","png"));
    }catch(err){ status(t("exportFail")); }
  });
}
function exportReport(){
  status(t("preparing"));
  fontsReady().then(function(){
    try{ drawReport(); }catch(err){ status(t("exportFail")); }
  });
}
function drawReport(){
  var W=3000, H=2000, M=90, rtl=settings.lang==="ar", C=themeInk();
  var IMGW=1840, GAP=60, INFOW=W-2*M-IMGW-GAP;
  var heroH=Math.round(IMGW*9/16), smallW=Math.floor((IMGW-2*40)/3), smallH=Math.round(smallW*0.62);
  var shots=captureShots([
    { w:IMGW, h:heroH, theta:-0.55, phi:1.0, margin:0.07 },
    { w:smallW*2, h:smallH*2, theta:0, phi:0.1, margin:0.08 },
    { w:smallW*2, h:smallH*2, theta:0, phi:1.42, margin:0.08 },
    { w:smallW*2, h:smallH*2, theta:-Math.PI/2, phi:1.35, margin:0.08 }
  ]);
  var c=document.createElement("canvas"); c.width=W; c.height=H; var g=c.getContext("2d");
  function X(x,w){ return rtl ? W-x-w : x; }
  function textAt(txt,x,y,w,align){ /* x,w in LTR layout coords; align "start" | "end" */
    g.textAlign=align||"start"; g.direction=rtl?"rtl":"ltr";
    var sx = (align==="end") ? (rtl?X(x,w):X(x,w)+w) : (rtl?X(x,w)+w:X(x,w));
    g.fillText(fitText(g,txt,w),sx,y);
  }
  g.fillStyle=C.bg; g.fillRect(0,0,W,H);
  g.textBaseline="alphabetic";
  /* header */
  g.fillStyle=C.acc; rrect(g,X(M,64),M,64,64,16); g.fill();
  g.strokeStyle=C.accInk; g.lineWidth=5; g.lineJoin="round";
  var lx=X(M,64); g.strokeRect(lx+13,M+15,38,24); g.beginPath(); g.moveTo(lx+32,M+39); g.lineTo(lx+32,M+49); g.moveTo(lx+20,M+50); g.lineTo(lx+44,M+50); g.stroke();
  g.fillStyle=C.acc; g.font=fnt(700,34); textAt(t("appTitle"),M+86,M+30,900,"start");
  g.fillStyle=C.soft; g.font=fnt(500,24); textAt(t("appSub"),M+86,M+64,900,"start");
  g.fillStyle=C.ink; g.font=fnt(700,72); textAt(t("reportTitle"),M,M+180,1600,"start");
  var dateTxt=new Date().toLocaleDateString(rtl?"ar-u-nu-latn":"en-GB",{ year:"numeric", month:"long", day:"numeric" });
  g.fillStyle=C.soft; g.font=fnt(500,28); textAt(t("createdOn",dateTxt),W-M-900,M+130,900,"end");
  g.fillStyle=C.ink; g.font=fnt(700,34); textAt(t("itemsCount",items.length),W-M-900,M+180,900,"end");
  var top=M+230;
  g.fillStyle=C.line; g.fillRect(M,top-20,W-2*M,2);
  /* images */
  function framed(img,x,y,w,h,label){
    g.save(); rrect(g,X(x,w),y,w,h,26); g.clip(); g.drawImage(img,X(x,w),y,w,h); g.restore();
    g.strokeStyle=C.line; g.lineWidth=2; rrect(g,X(x,w),y,w,h,26); g.stroke();
    g.font=fnt(600,24); var tw=g.measureText(label).width+36, px=X(x+18,tw), py=y+18;
    g.globalAlpha=0.9; g.fillStyle=C.panel; rrect(g,px,py,tw,46,23); g.fill(); g.globalAlpha=1;
    g.fillStyle=C.ink; g.textAlign="center"; g.direction=rtl?"rtl":"ltr"; g.fillText(label,px+tw/2,py+32);
  }
  framed(shots[0],M,top+20,IMGW,heroH,t("viewAngle"));
  var sy=top+20+heroH+40;
  [[1,"viewTop"],[2,"viewFront"],[3,"viewSide"]].forEach(function(s2,i){ framed(shots[s2[0]],M+i*(smallW+40),sy,smallW,smallH,t(s2[1])); });
  /* info column */
  var ix=M+IMGW+GAP, iy=top+20, pad=40;
  function card(y,h){ g.fillStyle=C.card; rrect(g,X(ix,INFOW),y,INFOW,h,26); g.fill(); g.strokeStyle=C.line; g.lineWidth=2; rrect(g,X(ix,INFOW),y,INFOW,h,26); g.stroke(); }
  var dc=DESK_COLORS.filter(function(q){ return q.id===desk.color; })[0]||DESK_COLORS[0];
  var ls=LEG_STYLES.filter(function(q){ return q.id===(desk.legs||"four"); })[0]||LEG_STYLES[0];
  var shapeName=desk.shape==="rect"?t("rect"):desk.shape==="lRight"?t("lRight"):t("lLeft");
  var sizeTxt=dims(desk.w,desk.d)+" "+t("cm")+(desk.shape!=="rect" ? " · "+t("retLen")+" "+desk.rl+" · "+t("retDepth")+" "+desk.rd : "");
  var kv=[[t("kvShape"),shapeName],[t("kvSize"),sizeTxt],[t("kvHeight"),desk.h+" "+t("cm")],[t("thickness"),desk.thickness+" "+t("cm")],[t("kvLegs"),L(ls.n)],[t("kvColor"),L(dc.n)]];
  var deskH=110+kv.length*58;
  card(iy,deskH);
  g.fillStyle=C.ink; g.font=fnt(700,34); textAt(t("deskWord"),ix+pad,iy+66,INFOW-2*pad,"start");
  kv.forEach(function(r,i){
    var y=iy+130+i*58;
    g.fillStyle=C.soft; g.font=fnt(500,24); textAt(r[0],ix+pad,y,260,"start");
    g.fillStyle=C.ink; g.font=fnt(600,26); textAt(r[1],ix+pad+260,y,INFOW-2*pad-260,"end");
    if(i<kv.length-1){ g.fillStyle=C.line; g.fillRect(X(ix+pad,INFOW-2*pad),y+20,INFOW-2*pad,1.5); }
  });
  var ly=iy+deskH+40, listH=(sy+smallH)-ly;
  card(ly,listH);
  var list=sortedEntries();
  g.fillStyle=C.ink; g.font=fnt(700,34); textAt(t("partsTitle",list.length),ix+pad,ly+66,INFOW-2*pad,"start");
  var cols=list.length>12?2:1, perCol=Math.ceil(list.length/cols)||1, colGap=36, colW=(INFOW-2*pad-(cols-1)*colGap)/cols;
  var areaTop=ly+104, rowH=Math.min(96,(listH-104-24)/perCol), nameSz=Math.round(clamp(rowH*0.34,19,27)), metaSz=Math.round(clamp(rowH*0.26,15,21));
  list.forEach(function(e,i){
    var col=Math.floor(i/perCol), row=i%perCol, cx0=ix+pad+col*(colW+colGap), y=areaTop+row*rowH, it=e.it;
    var dot=(it.kind==="monitor"||it.kind==="laptop")?it.color:(it.kind==="pc"&&it.rgb?it.rgbColor:(it.color||"#888888"));
    var dx=rtl?X(cx0,colW)+colW-9:X(cx0,colW)+9;
    g.fillStyle=dot; g.beginPath(); g.arc(dx,y+nameSz*0.55,9,0,Math.PI*2); g.fill(); g.strokeStyle=C.faint; g.lineWidth=2; g.stroke();
    g.fillStyle=C.ink; g.font=fnt(600,nameSz); textAt(nameOf(it),cx0+30,y+nameSz,colW-30,"start");
    g.fillStyle=C.soft; g.font=fnt(400,metaSz); textAt(L(KINDS[it.kind].name)+" · "+itemDims(e)+" "+t("cm"),cx0+30,y+nameSz+metaSz+10,colW-30,"start");
  });
  if(!list.length){ g.fillStyle=C.soft; g.font=fnt(500,26); textAt(t("fitEmpty"),ix+pad,areaTop+40,INFOW-2*pad,"start"); }
  /* footer */
  g.fillStyle=C.line; g.fillRect(M,H-M-60,W-2*M,2);
  g.fillStyle=C.ink;g.font=fnt(600,23);textAt(loadSummary(),M,H-M-72,W-2*M,'start');
  g.fillStyle=C.soft;g.font=fnt(400,21);textAt(loadMessage(deskLoad()),M,H-M-34,W-2*M,'start');
  g.fillStyle=C.faint; g.font=fnt(500,20); textAt(t("loadNote"),M,H-M+4,W-2*M,"start");
  toPng(c,fileName("report","png"));
}
function plainText(v){ return String(v).replace(/[\u2066-\u2069]/g,""); }
/* Small, self-contained Office Open XML exporter. Text cells are always literal
   strings; user-provided names are never treated as spreadsheet formulas. */
function xmlText(value){
  return String(value==null?'':value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g,'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}
function xlsxZip(files){
  var encoder=new TextEncoder(),chunks=[],directory=[],offset=0,now=new Date();
  var dosTime=(now.getHours()<<11)|(now.getMinutes()<<5)|(now.getSeconds()>>1),dosDate=((Math.max(1980,now.getFullYear())-1980)<<9)|((now.getMonth()+1)<<5)|now.getDate();
  function header(size){var bytes=new Uint8Array(size);return {bytes:bytes,view:new DataView(bytes.buffer)};}
  function crc32(data){var crc=0xffffffff;for(var i=0;i<data.length;i++){crc^=data[i];for(var j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
  Object.keys(files).forEach(function(path){
    var name=encoder.encode(path),body=encoder.encode(files[path]),crc=crc32(body),local=header(30),v=local.view;
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x0800,true);v.setUint16(10,dosTime,true);v.setUint16(12,dosDate,true);
    v.setUint32(14,crc,true);v.setUint32(18,body.length,true);v.setUint32(22,body.length,true);v.setUint16(26,name.length,true);
    chunks.push(local.bytes,name,body);
    var central=header(46);v=central.view;v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x0800,true);
    v.setUint16(12,dosTime,true);v.setUint16(14,dosDate,true);v.setUint32(16,crc,true);v.setUint32(20,body.length,true);v.setUint32(24,body.length,true);
    v.setUint16(28,name.length,true);v.setUint32(42,offset,true);directory.push(central.bytes,name);offset+=30+name.length+body.length;
  });
  var size=directory.reduce(function(sum,bytes){return sum+bytes.length;},0),end=header(22),v=end.view,n=Object.keys(files).length;
  v.setUint32(0,0x06054b50,true);v.setUint16(8,n,true);v.setUint16(10,n,true);v.setUint32(12,size,true);v.setUint32(16,offset,true);
  return new Blob(chunks.concat(directory,[end.bytes]),{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
function buildExcel(){
  var XML='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  var rows=[],merges=[],list=sortedEntries(),rtl=settings.lang==='ar',headerRow=8,start=9,end=start+list.length-1,totalRow=Math.max(start,end+2),load=deskLoad();
  function cell(ref,value,style,formula){
    var c='<c r="'+ref+'" s="'+(style||0)+'"';
    if(formula)return c+'><f>'+xmlText(formula)+'</f><v>'+value+'</v></c>';
    if(typeof value==='number'&&Number.isFinite(value))return c+'><v>'+value+'</v></c>';
    if(value==null)return c+'/>';
    return c+' t="inlineStr"><is><t xml:space="preserve">'+xmlText(plainText(value))+'</t></is></c>';
  }
  function row(number,values,style,height){
    rows.push('<row r="'+number+'" ht="'+(height||34)+'" customHeight="1">'+values.map(function(v,i){return cell(String.fromCharCode(65+i)+number,v,typeof style==='function'?style(i):style);}).join('')+'</row>');
  }
  function merged(number,text,style,height){row(number,[text],style,height);merges.push('A'+number+':H'+number);}
  merged(1,t('appTitle')+' — '+t('partsTitle',list.length),1,38);
  merged(2,t('excelSnapshot')+' · '+dateStamp(),2,26);
  merged(3,deskSummary(),2,36);
  merged(4,t('thickness')+': '+fmt(desk.thickness)+' · '+t('capacity')+': '+(load.capacity?fmt(load.capacity)+' '+t('kg'):t('unknownWeight')),2,34);
  merged(5,loadMessage(load),load.level==='normal'?2:7,42);
  merged(6,t('excelEstimateNote'),2,32);
  row(headerRow,[t('colName'),t('colType'),t('colModel'),t('colDims'),t('weightColumn'),t('place'),t('deskWeightColumn'),t('colNotes')],3,48);
  list.forEach(function(e,i){
    var it=e.it,n=start+i,w=itemWeight(it),onFloor=layerOf(it)==='floor',values=[nameOf(it),L(KINDS[it.kind].name),modelOf(it),itemDims(e,true),w,onFloor?t('onFloor'):t('onDesk'),onFloor?0:w,metaOf(it)];
    var body=values.map(function(value,column){
      var ref=String.fromCharCode(65+column)+n,style=(column===4||column===6)?5:(i%2?4:0);
      if(column===6){
        var f='IF(F'+n+'="'+t('onFloor').replace(/"/g,'""')+'",0,IF(ISNUMBER(E'+n+'),E'+n+',""))';
        if(value==null)return '<c r="'+ref+'" s="'+style+'" t="str"><f>'+xmlText(f)+'</f><v></v></c>';
        return cell(ref,value,style,f);
      }
      return cell(ref,value,style);
    }).join('');rows.push('<row r="'+n+'" ht="44" customHeight="1">'+body+'</row>');
  });
  var totalFormula=list.length?'SUM(G'+start+':G'+end+')':'0';
  rows.push('<row r="'+totalRow+'" ht="32" customHeight="1">'+cell('A'+totalRow,t('weightTitle')+' ('+t('kg')+')',6)+cell('G'+totalRow,load.total,6,totalFormula)+'</row>');
  merges.push('A'+totalRow+':F'+totalRow);
  var noteRow=totalRow+2;
  if(load.unknown){merged(noteRow,t('loadUnknown',load.unknown),7,34);noteRow++;}
  merged(noteRow,t('loadNote'),2,48);merged(noteRow+1,t('disclaimer'),2,34);
  var widths=[30,20,27,23,21,20,21,44],cols=widths.map(function(w,i){return '<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>';}).join('');
  var sheet=XML+'<worksheet xmlns="'+NS+'"><dimension ref="A1:H'+(noteRow+1)+'"/><sheetViews><sheetView workbookViewId="0" showGridLines="0" rightToLeft="'+(rtl?1:0)+'"><pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A9" sqref="A9"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="30"/><cols>'+cols+'</cols><sheetData>'+rows.join('')+'</sheetData>';
  if(list.length)sheet+='<autoFilter ref="A8:H'+end+'"/>';
  sheet+='<mergeCells count="'+merges.length+'">'+merges.map(function(r){return '<mergeCell ref="'+r+'"/>';}).join('')+'</mergeCells><pageMargins left="0.3" right="0.3" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9"/></worksheet>';
  var styles=XML+'<styleSheet xmlns="'+NS+'"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.0"/></numFmts><fonts count="4"><font><sz val="11"/><color rgb="FF263346"/><name val="Cairo"/></font><font><b/><sz val="19"/><color rgb="FF234777"/><name val="Cairo"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Cairo"/></font><font><b/><sz val="11"/><color rgb="FF234777"/><name val="Cairo"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF315681"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF0F4F8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF0D9"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8">';
  [[0,0,0],[1,0,0],[0,0,0],[2,2,0],[0,3,0],[0,0,164],[3,3,164],[0,4,0]].forEach(function(s){styles+='<xf numFmtId="'+s[2]+'" fontId="'+s[0]+'" fillId="'+s[1]+'" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1" applyNumberFormat="1"><alignment vertical="center" wrapText="1" readingOrder="'+(rtl?2:1)+'"/></xf>';});
  styles+='</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  var files={};
  files['[Content_Types].xml']=XML+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  files['_rels/.rels']=XML+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  files['xl/workbook.xml']=XML+'<workbook xmlns="'+NS+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="'+xmlText(rtl?'المكتب والمعدات':'Desk and equipment')+'" sheetId="1" r:id="rId1"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>';
  files['xl/_rels/workbook.xml.rels']=XML+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
  files['xl/worksheets/sheet1.xml']=sheet;files['xl/styles.xml']=styles;
  return xlsxZip(files);
}
function exportExcel(){saveFile(fileName('parts','xlsx'),buildExcel());}

function exportJSON(){
  var data={ app:"desk-planner", version:3, exported:new Date().toISOString(),
    units:{ desk:"cm", customItem:"cm", positions:"inch (x, z from the desk centre)", rotation:"radians", weight:"kg", capacity:"kg (user-entered manufacturer rating)", thickness:"cm" },
    desk:desk, items:items };
  saveFile(fileName("","json"), JSON.stringify(data,null,2));
}
function sanitizeItem(x){
  if(!x || !KINDS[x.kind]) return null;
  var o={}; for(var k in x){ var v=x[k]; if(typeof v==="string"||typeof v==="number"||typeof v==="boolean") o[k]=v; }
  o.kind=x.kind;
  if(o.kind==="monitor"||o.kind==="laptop"){
    var S=SCREEN[o.kind]; o.diagonal=clamp(+o.diagonal||S.min,S.min,S.max);
    if(!(o.ratioW>0&&o.ratioH>0)){ o.ratioW=16; o.ratioH=9; }
    if(typeof o.color!=="string"||!/^#[0-9a-f]{6}$/i.test(o.color)) o.color=SCREEN_COLORS[0];
  } else if(o.kind==="custom"){
    o.w=clamp(+o.w||30,1,300); o.d=clamp(+o.d||20,1,200); o.h=clamp(+o.h||15,0.5,300);
    o.place=o.place==="floor"?"floor":"desk";
    if(typeof o.color!=="string"||!/^#[0-9a-f]{6}$/i.test(o.color)) o.color="#8a8e95";
    delete o.variant;
  } else {
    if(!VARIANTS[o.kind].some(function(v){ return v.id===o.variant; })) o.variant=VARIANTS[o.kind][0].id;
    if(typeof o.color!=="string"||!/^#[0-9a-f]{6}$/i.test(o.color)) o.color="#1f2023";
  }
  if(o.kind==="plant") o.size=plantScale(o); else delete o.size;
  if(!isNum(o.weightKg)||o.weightKg<0||o.weightKg>500)delete o.weightKg;
  if(x.weightKg===null)o.weightKg=null;
  o.curved=o.kind==='monitor'&&o.curved===true;
  if(['auto','back','front','left','right'].indexOf(o.mountSide)<0)o.mountSide='auto';
  o.name=cleanName(o.name);
  if(o.name && isAutoName(o,o.name)) o.name="";
  ["x","z","rot","lift","seatH","scale"].forEach(function(k){ if(k in o && !isNum(o[k])) delete o[k]; });
  if(isNum(o.x)) o.x=clamp(o.x,-400,400); if(isNum(o.z)) o.z=clamp(o.z,-400,400);
  if(isNum(o.seatH)) o.seatH=clamp(o.seatH,38*CM,62*CM);
  if(isNum(o.scale)) o.scale=clamp(o.scale,0.85,1.2);
  if(isNum(o.lift)) o.lift=clamp(o.lift,0.5,20);
  return o;
}
importInput.addEventListener("change", function(){
  var f=importInput.files&&importInput.files[0]; if(!f) return;
  var r=new FileReader();
  r.onload=function(){
    try{
      var o=JSON.parse(r.result);
      if(!o || !Array.isArray(o.items)) throw new Error("bad");
      var its=o.items.map(sanitizeItem).filter(Boolean).slice(0,24);
      its.forEach(function(it,i){ it.id=i+1; });
      if(applyDeskData(o.desk)) saveDesk();
      items=its; nextId=its.length+1; selectedId=null; editorOpen=false;
      rebuild(); renderDeskTab(); status(t("imported",its.length));
    }catch(e){ status(t("badFile")); }
    importInput.value="";
  };
  r.onerror=function(){ status(t("badFile")); };
  r.readAsText(f);
});
exportMenu.querySelectorAll("[data-res]").forEach(function(b){
  b.addEventListener("click", function(){
    exportRes=+b.getAttribute("data-res");
    exportMenu.querySelectorAll("[data-res]").forEach(function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); });
  });
});
exportMenu.querySelectorAll("[data-exp]").forEach(function(b){b.addEventListener("click",function(){exportKind=b.dataset.exp;paintExport();});});

/* ================= mobile ================= */
var panel=document.getElementById("panel"), panelToggle=document.getElementById("panelToggle");
function setPanel(open){
 panel.classList.toggle("collapsed",!open);panelToggle.setAttribute("aria-expanded",open?"true":"false");
 document.getElementById("sheetState").textContent=t(open?"collapse":"expand");resize();
}
panelToggle.addEventListener("click",function(){setPanel(panel.classList.contains("collapsed"));});
document.getElementById("panelClose").addEventListener("click",function(){setPanel(false);});
setPanel(!isMobile());
var wasMobile=isMobile();window.addEventListener("resize",function(){var m=isMobile();if(m!==wasMobile){wasMobile=m;setPanel(!m);}});
if(window.visualViewport)window.visualViewport.addEventListener("resize",function(){
  panel.style.maxHeight=isMobile()?Math.max(160,window.visualViewport.height-120)+"px":"";
  resize();var a=document.activeElement;if(a&&a.tagName==="INPUT")a.scrollIntoView({block:"nearest"});
});
document.getElementById("fitBtn").onclick=function(){computeFrame();};
document.getElementById("openBtn").onclick=function(){importInput.click();};
var welcome=document.getElementById("welcome");
try{welcome.hidden=!!localStorage.getItem("desk-planner-ux-seen")||!!localStorage.getItem("desk-planner-3d.items.v4")||!!localStorage.getItem("desk-planner-3d.items.v3");localStorage.setItem("desk-planner-ux-seen","1");}catch(_){}
document.getElementById("welcomeClose").onclick=function(){welcome.hidden=true;};

/* ================= init ================= */
applyScenePalette(); applyStatic();
renderAdd(); renderDeskTab(); showTab("tab-desk");
resize(); rebuild(); setView("angle"); recordNow();
radius=goalRadius; target.copy(goalTarget);
tick();
fontsReady().then(function(){ rebuild({ reframe:false }); });
})();
