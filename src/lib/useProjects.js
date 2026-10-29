import { useEffect, useState } from 'react';
import { selectedWorkData } from '../data/agencyData';
import { fetchProjects } from './applications';

// Projects come from the admin panel; the built-in list shows while loading and if the server is offline
export default function useProjects() {
  const [projects, setProjects] = useState(selectedWorkData);

  useEffect(() => {
    let cancelled = false;
    fetchProjects()
      .then((list) => !cancelled && setProjects(list))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return projects;
}
