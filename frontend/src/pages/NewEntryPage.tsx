import { useNavigate } from 'react-router-dom';
import ThoughtEntryForm from '../components/ThoughtEntryForm';
import { Entry } from '../types';

export default function NewEntryPage() {
  const navigate = useNavigate();

  const handleSave = (entry: Entry) => {
    // Navigate to the entry detail page or dashboard
    navigate(`/entries/${entry.id}`);
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <ThoughtEntryForm
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}