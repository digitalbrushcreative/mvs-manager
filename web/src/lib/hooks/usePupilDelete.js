import { usePupils } from './usePupils';
import { usePayments } from './usePayments';
import { useDocuments } from './useDocuments';

export function usePupilDelete() {
  const { remove: removePupil } = usePupils();
  const payments = usePayments();
  const documents = useDocuments();

  return async function deletePupil(pupilId) {
    await Promise.all([
      payments.replace(payments.data.filter((p) => p.pupilId !== pupilId)),
      documents.replace(documents.data.filter((d) => d.pupilId !== pupilId)),
    ]);
    await removePupil(pupilId);
  };
}
