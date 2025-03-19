import { ClientForm } from '../components/ClientForm';

export function NewClient() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Customer</h1>
      <ClientForm />
    </div>
  );
} 