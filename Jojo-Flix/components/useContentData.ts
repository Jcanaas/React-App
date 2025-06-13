import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import type { ContentItem } from './ContentData';

export function useContentData() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'content'));
      const items: ContentItem[] = [];
      snapshot.forEach(doc => {
        items.push({ ...(doc.data() as ContentItem), id: doc.id });
      });
      setContent(items);
      setLoading(false);
    };
    fetchContent();
  }, []);

  return { content, loading };
}