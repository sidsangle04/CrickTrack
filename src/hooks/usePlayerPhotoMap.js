import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Photos live on the player profiles in the Players section. An auction player
// added by name only can borrow the matching profile photo, so the player on the
// block always shows a face.
export default function usePlayerPhotoMap(groundMode) {
  const { data } = useQuery({
    queryKey: ['player-photos', groundMode || 'all'],
    queryFn: async () => {
      const query = groundMode ? { ground_mode: groundMode } : {};
      const list = await base44.entities.Player.filter(query, 'name', 2000);
      const map = {};
      list.forEach((p) => {
        const key = (p.name || '').trim().toLowerCase();
        if (key && p.photo_url && !map[key]) map[key] = p.photo_url;
      });
      return map;
    }
  });
  return data || {};
}