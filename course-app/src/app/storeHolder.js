/**
 * storeHolder.js
 *
 * Module trung gian để lưu reference đến Redux store.
 * Không import gì từ store hay slice → giải quyết require cycle.
 *
 * Flow:
 *   store.js         → setStore(store)   (inject sau khi configureStore)
 *   axiosClient.js   → getStore()        (lấy store lazy khi cần dispatch)
 */

let _store = null;

/**
 * Inject Redux store vào holder.
 * Phải được gọi ngay sau configureStore() trong store.js.
 * @param {import('@reduxjs/toolkit').EnhancedStore} store
 */
export const setStore = (store) => {
    _store = store;
};

/**
 * Lấy Redux store đã được inject.
 * Trả về null nếu chưa được inject (không nên xảy ra trong runtime bình thường).
 * @returns {import('@reduxjs/toolkit').EnhancedStore | null}
 */
export const getStore = () => _store;
