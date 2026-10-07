import { useQuery } from '@tanstack/react-query';
import { loadVenueAverages } from '@/lib/venueStats';

// Shared, cached venue averages so the Venues list and live scoring agree.
export default function useVenueAverages() {
  return useQuery({
    queryKey: ['venue-averages'],
    queryFn: loadVenueAverages,
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
}