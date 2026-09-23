/* Applies the saved theme and language before the first paint, so the page never flashes. */
(function(){try{var s=JSON.parse(localStorage.getItem("desk-planner-3d.settings.v1")||"{}");
var th=s.theme||((window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light");
document.documentElement.setAttribute("data-theme",th);
if(s.lang==="en"){document.documentElement.lang="en";document.documentElement.dir="ltr";}}catch(e){}})();
