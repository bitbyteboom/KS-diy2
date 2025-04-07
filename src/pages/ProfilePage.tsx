import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import ProfileOnboarding from './ProfileOnboarding';
import ProfileViewEdit from './ProfileViewEdit';

const ProfilePage = () => {
  const { profile } = useProfile();

  if (!profile) {
    return <ProfileOnboarding />;
  } else {
    return <ProfileViewEdit />;
  }
};

export default ProfilePage;
