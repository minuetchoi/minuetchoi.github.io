---
layout: post
title: "[Java] Google Play Developer API 가이드"
date: 2022-05-16 15:20:23 +0900
category: java
---


# Google Play Developer API는 OAuth 인증을 통해 권한을 획득하는 방식

본 가이드라인은 OAuth 인증을 이용한 샘플입니다.

1. 유효한 사용자를 Google에서 redirect_uri에 code를 보내줍니다.
1. 해당 코드를 가지고 다시 Google에 보내 access_token과 refresh_token을 획득합니다.
1. refresh_token을 얻게 되면 위와 같은 인증 과정을 거지치 않고 access_token을 계속 획득 가능합니다.
1. token을 api요청시 보내 인증을 받고 값을 return 받으면 완료 됩니다.



## 1. 유효한 사용자를 Google에서 redirect_uri에 code를 보내줍니다.

- url: https://accounts.google.com/o/oauth2/auth
- method: get
- parameter
    - scope: https://www.googleapis.com/auth/androidpublisher
    - response_type: code
    - access_type: offline
    - redirect_uri: 본인 홈페이지상 리턴 받고 싶은 url 예) https://www.hongildong.com/google/oauth20/returnUrl
    - client_id: 발급받은 클라이언트ID 예) z118014375029-0u2osjrvekbrgdnlcg1rm347da2dlj0p.apps.googleusercontent.com

# 2. Refresh 토큰값 가져오기

- url: https://www.googleapis.com/oauth2/v4/token
- method: post
- parameter:
    - code: 1번에서 파라미터로 받은 code값 예) z4/0ARtbsJogwouxmi3I1ekahvrfGJ-36YW55tiV7hWZqM7zndAgABno3yDw7JK28a7puwaoRg
    - redirect_uri: 본인 홈페이지상 리턴 받고 싶은 url 예) https://www.hongildong.com/google/oauth20/returnUrl
    - client_id: 발급받은 클라이언트ID 예) z118014375029-0u2osjrvekbrgdnlcg1rm347da2dlj0p.apps.googleusercontent.com
    - client_secret: 발급받은 클라이언트 시크릿정보 예) zGOCSPX-tJy3bHH7jtwiP1X0ys-EN9gRa3Pm
    - grant_type: authorization_code

3. 2번에서 Refresh 토큰값으로 Access 토큰을 구하여 리뷰정보 취득


