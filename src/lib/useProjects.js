import { useEffect, useState } from 'react';
import { selectedWorkData } from '../data/agencyData';
import { fetchProjects } from './applications';

// Projects come from the admin panel (null while loading); the built-in list is used if the server is offline
export default function useProjects() {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((list) => !cancelled && setProjects(list))
      .catch(() => !cancelled && setProjects(selectedWorkData));
    return () => {
      cancelled = true;
    };
  }, []);

  return projects;
}
