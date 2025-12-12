### 1. 安裝node.js
安裝 Node.js，然後在專案目錄下執行：
```bash
npm install
```
### 2. 設定 Firebase (Google 登入)
1.  到 [Firebase Console](https://console.firebase.google.com/)。
2.  建立一個新專案。
3.  **啟用 Authentication**：
    *   進入 **Build** > **Authentication**。
    *   點選 **Get started**。
    *   在 **Sign-in method** 分頁，啟用 **Google** 登入。
    *   設定 **Project support email** 然後儲存。
4.  **取得設定參數**：
    *   點選左上角 **Project Overview** 旁的齒輪 > **Project settings**。
    *   在 **Your apps** 區塊，點擊 `</>` (Web) 圖示建立應用程式。
    *   選擇 **Config** (複製 `firebaseConfig` 物件內容)。
5.  **更新程式碼**：
    *   打開 `index.html`。
    *   找到 `<script>` 區塊中的 `window.__firebase_config`。
    *   將您的設定填入：
    ```javascript
    window.__firebase_config = JSON.stringify({
        apiKey: "Your_API_KEY",
        authDomain: "Your_PROJECT_ID.firebaseapp.com",
        projectId: "Your_PROJECT_ID",
        storageBucket: "Your_PROJECT_ID.firebasestorage.app",
        messagingSenderId: "Your_SENDER_ID",
        appId: "Your_APP_ID"
    });
    ```

### 3. 設定 Gemini API (AI 搜尋)
1.  到 [Google AI Studio](https://aistudio.google.com/)。
2.  點擊 **Get API key**。
3.  複製 API Key。
4.  到 `scripts/search.js`。
5.  修改最上方的 `GEMINI_API_KEY` 變數：
    ```javascript
    const GEMINI_API_KEY = 'Your_GEMINI_API_KEY';
    ```

### 4. 啟動測試伺服器
透過本地伺服器執行。
1.  在專案目錄下開啟終端機
2.  執行以下指令啟動伺服器：
    ```bash
    npx http-server -c-1
    ```
3.  打開瀏覽器，前往：
    **[http://localhost:8080](http://localhost:8080)**
