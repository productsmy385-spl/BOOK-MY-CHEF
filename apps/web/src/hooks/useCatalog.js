import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

/** Service categories, cuisines, pricing models and delivery modes from the API. */
export function useCatalog() {
  const query = useQuery({ queryKey: ['catalog'], queryFn: api.catalog, staleTime: 10 * 60 * 1000 });
  const data = query.data;
  const helpers = useMemo(() => {
    const categories = data?.categories || [];
    const pricingModels = data?.pricingModels || [];
    const deliveryModes = data?.deliveryModes || [];
    const byCode = Object.fromEntries(categories.map((c) => [c.code, c]));
    const pricingLabels = Object.fromEntries(pricingModels.map((p) => [p.code, p.label]));
    const modeLabels = Object.fromEntries(deliveryModes.map((m) => [m.code, m.label]));
    const cuisineLabels = Object.fromEntries((data?.cuisines || []).map((c) => [c.code, c.label]));
    const m = data?.menu || {};
    const labels = (list) => Object.fromEntries((list || []).map((o) => [o.code, o.label]));
    const menu = {
      courses: m.courses || [], diets: m.diets || [], spiceLevels: m.spiceLevels || [],
      allergens: m.allergens || [], mealTypes: m.mealTypes || [],
      courseLabels: labels(m.courses), dietLabels: labels(m.diets), spiceLabels: labels(m.spiceLevels),
      allergenLabels: labels(m.allergens), mealLabels: labels(m.mealTypes),
    };
    const eventTypes = data?.eventTypes || [];
    return {
      menu,
      eventTypes,
      eventTypeLabels: Object.fromEntries(eventTypes.map((t) => [t.code, t.label])),
      categories,
      groups: data?.groups || [],
      cuisines: data?.cuisines || [],
      pricingModels,
      deliveryModes,
      categoryLabel: (code) => byCode[code]?.label || code,
      category: (code) => byCode[code],
      pricingLabels,
      modeLabels,
      cuisineLabels,
    };
  }, [data]);
  return { ...helpers, isLoading: query.isLoading, error: query.error };
}
