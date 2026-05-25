import { useEffect } from 'react';

/** 页面挂载时拉取最新列表（配合 Content 按 activePage 卸载/挂载，避免缓存旧数据） */
export function useInitialListRefresh(refresh: () => void | Promise<void>) {
  useEffect(() => {
    void refresh();
  }, []);
}
