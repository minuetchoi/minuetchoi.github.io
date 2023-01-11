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

# 3. 2번에서 Refresh 토큰값으로 Access 토큰을 구하여 리뷰정보 취득

```java
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.KeyManagementException;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.net.ssl.SSLContext;

import org.apache.commons.lang3.StringUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.ssl.SSLContexts;
import org.apache.http.util.EntityUtils;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;

public class GoogleAPITest {

    private static final String refresh_token = "2//0ebPB2uol7H1nCgYIARAAGA4SNwF-L9Ir33uh9QoyzklXsvpv-XQukeCVraLRu_KTtWjQzTJUkcRYM7VdyferXH_pYL4GFa9Cyps";

    public static void main(String[] args) throws NoSuchAlgorithmException, ClientProtocolException, IOException,
            URISyntaxException, KeyManagementException, KeyStoreException {

        GoogleAPITest api = new GoogleAPITest();
        String token = api.getAccessToken().replaceAll("\"", "");
        List<Map<String, String>> res = api.getReviewDetails("앱패키지명", token);
        for (Map<String, String> map : res) {
            break;
        }
    }

    public Map<String, String> getClientInfo() {
        String keyPath = "json파일";
        JsonObject object = (JsonObject) readJson(keyPath).get("web");
        JsonArray redirectUris = (JsonArray) object.get("redirect_uris");
        object.remove("redirect_uris");
        object.addProperty("redirect_uri", redirectUris.get(0).getAsString());
        Type type = new TypeToken<Map<String, String>>() {
        }.getType();
        Map<String, String> clientInfo = new Gson().fromJson(object, type);
        return clientInfo;
    }

    /**
     * refresh token으로 access token 생성하기
     * 
     * @return
     * @throws NoSuchAlgorithmException
     * @throws IOException
     * @throws ClientProtocolException
     * @throws URISyntaxException
     * @throws KeyStoreException
     * @throws KeyManagementException
     */
    public String getAccessToken() throws NoSuchAlgorithmException, ClientProtocolException, IOException,
            URISyntaxException, KeyManagementException, KeyStoreException {
        Map<String, String> clientInfo = getClientInfo();
        System.err.println(clientInfo.toString());
        URL url = new URL("https://www.googleapis.com/oauth2/v4/token");
        String responseBody = getAccessTokenX509Post(url, refresh_token, clientInfo.get("client_id"),
                clientInfo.get("client_secret"), clientInfo.get("redirect_uri"));
        JsonObject object = new Gson().fromJson(responseBody, JsonObject.class);
        String accessToken = object.get("access_token").toString();
        return accessToken;
    }

    private String getAccessTokenX509Post(URL url, String token, String clientId, String clientSecret,
            String redirectURI) throws ClientProtocolException, IOException, URISyntaxException, KeyManagementException,
            NoSuchAlgorithmException, KeyStoreException {

        SSLContext sslContext = SSLContexts.custom().loadTrustMaterial((chain, authType) -> true).build();
        SSLConnectionSocketFactory sslConnectionSocketFactory = new SSLConnectionSocketFactory(sslContext);
        CloseableHttpClient httpClient = HttpClients.custom().setSSLSocketFactory(sslConnectionSocketFactory).build();

        HttpPost httpPost = new HttpPost(url.toURI());
        MultipartEntityBuilder multipartEntity = MultipartEntityBuilder.create();
        multipartEntity.addTextBody("refresh_token", refresh_token);
        multipartEntity.addTextBody("client_id", clientId);
        multipartEntity.addTextBody("client_secret", clientSecret);
        multipartEntity.addTextBody("redirect_uri", redirectURI);
        multipartEntity.addTextBody("grant_type", "refresh_token");

        httpPost.setEntity(multipartEntity.build());

        HttpResponse response = httpClient.execute(httpPost);
        HttpEntity entity = response.getEntity();

        return EntityUtils.toString(entity, "UTF-8");
    }

    private JsonObject readJson(String keyPath) {
        InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream(keyPath);
        JsonObject keyInfo = new Gson().fromJson(new InputStreamReader(inputStream), JsonObject.class);
        return keyInfo;
    }

    public List<Map<String, String>> getReviewDetails(String packageName, String token)
            throws NoSuchAlgorithmException, ClientProtocolException, URISyntaxException, IOException {
        String link = "https://www.googleapis.com/androidpublisher/v3/applications/" + packageName
                + "/reviews?access_token=" + token;
        List<Map<String, String>> res = commonJsonTask(link);
        return res;
    }

    private void setList(JsonArray array, List<Map<String, String>> list) {

        Map<String, String> map;
        JsonObject object;
        JsonArray comments;
        JsonObject comment;
        JsonObject userComment = new JsonObject();
        JsonObject developerComment = new JsonObject();

        for (int i = 0; i < array.size(); i++) {

            object = array.get(i).getAsJsonObject();
            comments = object.get("comments").getAsJsonArray();

            for (int j = 0; j < comments.size(); j++) {
                comment = comments.get(j).getAsJsonObject();
                if (comment.has("userComment")) {
                    userComment = comment.get("userComment").getAsJsonObject();
                }
                if (comment.has("developerComment")) {
                    developerComment = comment.get("developerComment").getAsJsonObject();
                }
            }

            map = new HashMap<>();
            map.put("packId", "com.shinhan.sbanking");
            map.put("rvwId", object.get("reviewId").getAsString());
            map.put("rptrNm", object.has("authorName") ? object.get("authorName").getAsString() : StringUtils.EMPTY);
            map.put("brNo", "which of?");
            map.put("brNm", "which of?");
            map.put("userId", "which of?");
            map.put("userNm", "which of?");
            map.put("userCtnt", userComment.get("text").getAsString());
            map.put("userLastModified", userComment.get("lastModified").getAsJsonObject().get("seconds").getAsString());
            map.put("starRating", userComment.get("starRating").getAsString());

            map.put("developerCtnt",
                    developerComment.has("text") ? developerComment.get("text").getAsString() : StringUtils.EMPTY);
            map.put("developerLastModified",
                    developerComment.has("lastModified")
                            ? developerComment.get("lastModified").getAsJsonObject().get("seconds").getAsString()
                            : StringUtils.EMPTY);
            list.add(map);
        }
    }

    private List<Map<String, String>> commonJsonTask(String link)
            throws NoSuchAlgorithmException, ClientProtocolException, URISyntaxException, IOException {
        URL url = new URL(link);
        String reviewDetails = getConnectResultByX509(url);
        JsonObject object = new Gson().fromJson(reviewDetails, JsonObject.class);
        List<Map<String, String>> list = new ArrayList<>();
        if (object.has("reviews")) {
            JsonArray array = (JsonArray) object.get("reviews");
            setList(array, list);
            String nextToken = getNextToken(object);
            while (StringUtils.isNotEmpty(nextToken)) {
                reviewDetails = getConnectResultByX509(new URL(link + "&token=" + nextToken.replaceAll("\"", "")));
                object = new Gson().fromJson(reviewDetails, JsonObject.class);
                if (object.has("reviews")) {
                    array = (JsonArray) object.get("reviews");
                    setList(array, list);
                    nextToken = getNextToken(object);
                    if (StringUtils.isEmpty(nextToken)) {
                        break;
                    }
                } else {
                    break;
                }
            }
        }
        return list;
    }

    private String getNextToken(JsonObject object) {
        JsonObject nextObject = null;
        String nextToken;
        if (object.has("tokenPagination")) {
            nextObject = (JsonObject) object.get("tokenPagination");
            if (nextObject != null && nextObject.has("nextPageToken")) {
                nextToken = nextObject.get("nextPageToken").toString();
            } else {
                nextToken = null;
            }
        } else {
            nextToken = null;
        }
        return nextToken;
    }

    private String getConnectResultByX509(URL url)
            throws NoSuchAlgorithmException, URISyntaxException, ClientProtocolException, IOException {

        HttpClient httpClient = HttpClientBuilder.create().build();
        HttpGet httpGet = new HttpGet(url.toURI());
        HttpResponse response = httpClient.execute(httpGet);
        HttpEntity entity = response.getEntity();

        return EntityUtils.toString(entity, "UTF-8");
    }
}

```

```json
{
    "web": {
        "client_id": "918014375029-0u2osjrvekbrgdnlcg1rm347da2dlj0p.apps.googleusercontent.com",
        "project_id": "api-5722814114791747414-261939",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "GGCSPX-tJy3bHH7jtwiP1X0ys-EN9gRa3Pm",
        "redirect_uris": [
            "https://url/google/oauth20/returnUrl"
        ]
    }
}
```