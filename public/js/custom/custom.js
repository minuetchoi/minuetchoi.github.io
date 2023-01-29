$(document).ready(function () {

});

// 북마크
function openNav() {
    document.getElementById("mySidenav").style.width = "200px";
}
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}
// 북마크
function openMenuNav() {
    console.log(document.getElementById("sidebar").style.width);
    if(document.getElementById("sidebar").style.display == 'none') { 
        document.getElementById("sidebar").style.display = '';
    } else {
        document.getElementById("sidebar").style.display = 'none';
    }
}
function closeMenuNav() {
    document.getElementById("sidebar").style.display = 'none';
}