// src/components/UserAvatar.tsx
import React from 'react';
import { Avatar } from '@mui/material';

interface UserAvatarProps {
  name: string;
  size?: number;
}

export default function UserAvatar({ name, size = 40 }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0].toUpperCase())
    .join('');

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 700,
      }}
    >
      {initials}
    </Avatar>
  );
}
