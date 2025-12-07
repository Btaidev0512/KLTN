import React from 'react';
import { Card, CardContent, Stack, Typography, Avatar, Box } from '@mui/material';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  color = '#FF6B35',
}) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
        transition: 'box-shadow 0.3s',
      }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Stack 
            direction="row" 
            justifyContent="space-between" 
            alignItems="flex-start"
          >
            <Stack spacing={1}>
              <Typography 
                color="text.secondary" 
                variant="overline"
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                {title}
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            </Stack>
            <Avatar
              sx={{
                bgcolor: color,
                width: 56,
                height: 56,
              }}
            >
              <Icon size={28} weight="duotone" />
            </Avatar>
          </Stack>

          {trend && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: trend.isPositive ? 'success.main' : 'error.main',
                }}
              >
                {trend.isPositive ? (
                  <ArrowUp size={16} weight="bold" />
                ) : (
                  <ArrowDown size={16} weight="bold" />
                )}
                <Typography 
                  variant="body2" 
                  fontWeight={600}
                  color="inherit"
                >
                  {Math.abs(trend.value)}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                So với tháng trước
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default StatCard;
