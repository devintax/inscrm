import PropTypes from 'prop-types';
import { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Link } from '@mui/material';

const Logo = forwardRef(({ disabledLink = false, sx, ...other }, ref) => {
  const logo = (
    <Box
      ref={ref}
      component="img"
      src="/assets/gis-logo.png"
      alt="Good Insurance Services"
      sx={{ width: 72, height: 72, objectFit: 'contain', cursor: 'pointer', ...sx }}
      {...other}
    />
  );

  if (disabledLink) return logo;

  return (
    <Link to="/" component={RouterLink} sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
});

Logo.propTypes = {
  sx: PropTypes.object,
  disabledLink: PropTypes.bool,
};

export default Logo;
