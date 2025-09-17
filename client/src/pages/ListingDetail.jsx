import React from 'react';
import { useParams } from 'react-router-dom';

const ListingDetail = () => {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold text-white">Listing Detail</h1>
      <p className="mt-4 text-gray-400">Details for listing {id} coming soon.</p>
    </div>
  );
};

export default ListingDetail;
