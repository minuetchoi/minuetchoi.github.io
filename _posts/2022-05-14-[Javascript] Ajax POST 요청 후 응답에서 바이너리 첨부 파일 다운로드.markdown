---
layout: post
title: "[Javascript] Ajax POST 요청 후 응답에서 바이너리 첨부 파일 다운로드"
date: 2022-05-14 15:20:23 +0900
category: javascript
---

스프링을 사용할 경우 Controller 함수에 @RequestBody 어노테이션을 붙인다.

{url}에는 경로를, {params}에는 파라미터 정보를 세팅한다.


```javascript
var request = new XMLHttpRequest();
request.open('POST', '{url}', true);
request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8");
request.responseType = 'blob';
request.onload = function (e) {
    var filename = '';
    var disposition = request.getResponseHeader('Content-Disposition');
    if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameeRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
            filename = decodeURI(matches[1].replace(/['"]/g, ''));
        }
    }

    if (this.status === 200) {
        var blob = this.response;
        if (window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveBlob(blob, filename);
        } else {
            var downloadLink = window.document.createElement('a');
            var contentTypeHeader = request.getResponseHeader("Content-Type");
            downloadLink.href = window.URL.createOBjectURL(new Blob([blob], { type: contentTypeHeader}));
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            alert('다운로드에 실패하였습니다.');
        }
    };
    request.send(JSON.stringify({params}));
};
```