import React, { useMemo, useState } from 'react';
import {
  Modal,
  IconButton,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Typography,
  Box,
  TextField,
  useMediaQuery,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { createTheme } from '@mui/material/styles';
import { DislikeOptions, LikeOptions, submitFeedback } from './api';
import { FeedbackType } from './api';
import { useDoc } from '@docusaurus/theme-common/internal';
import CloseIcon from '@mui/icons-material/Close';
import { ThemeClassNames } from '@docusaurus/theme-common';
import Translate from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#7c3aed',
    },
    secondary: {
      main: '#2dd4bf',
      light: '#5eead4',
      contrastText: '#f8fafc',
    },
  },
});

// Component for the "Report the Issue" link
const ReportIssueUrl = ({ onClose }) => {
  const { siteConfig } = useDocusaurusContext();
  const repoUrl = siteConfig?.customFields?.repoUrl || '#';
  const reportIssueUrl = `${repoUrl}/issues/new?title=Issue submitting feedback`;
  return (
    <a
      href={reportIssueUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={ThemeClassNames.common.editThisPage}
      onClick={onClose}
    >
      <Translate
        id="theme.common.openDocIssue"
        description="The link label to report an issue with submitting feedback"
      >
        Report the issue
      </Translate>
    </a>
  );
};

// Modal to thank users for feedback
const ThankYouModal = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="thank-you-modal-title">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        bgcolor: 'background.paper',
        color: 'text.primary',
        boxShadow: 24,
        p: 4,
        textAlign: 'center',
      }}
    >
      <IconButton
        sx={{ position: 'absolute', top: 8, right: 8 }}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>
      <Typography
        id="thank-you-modal-title"
        variant="h4"
        component="h2"
        sx={{ marginBottom: '0.5em' }}
      >
        Thank you for your feedback!
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '1em' }}>
        It helps us improve our technical content and user experience.
      </Typography>
    </Box>
  </Modal>
);

// Modal to show an error message for feedback submission
const OopsModal = ({ open, onClose }) => (
  <Modal open={open} onClose={onClose} aria-labelledby="oops-modal-title">
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
        textAlign: 'center',
        color: 'text.primary',
      }}
    >
      <IconButton
        sx={{ position: 'absolute', top: 8, right: 8 }}
        onClick={onClose}
      >
        <CloseIcon />
      </IconButton>
      <Typography
        id="oops-modal-title"
        variant="h4"
        component="h2"
        sx={{ marginBottom: '0.5em' }}
      >
        Oops!
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '1em' }}>
        It seems there was an issue with submitting your feedback.
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: '1em' }}>
        Try again or <ReportIssueUrl onClose={onClose} />.
      </Typography>
    </Box>
  </Modal>
);

const Feedback = () => {
  const [feedbackType, setFeedbackType] = useState(null);
  const [feedbackOptions, setFeedbackOptions] = useState([]);
  const [textData, setTextData] = useState('');
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [thankYouModalOpen, setThankYouModalOpen] = useState(false);
  const [oopsModalOpen, setOopsModalOpen] = useState(false);
  const { metadata } = useDoc();

  const handleFeedbackChange = (feedback, checked) => {
    if (checked) {
      setFeedbackOptions((prev) => [...prev, feedback]);
    } else {
      setFeedbackOptions((prev) => prev.filter((e) => e !== feedback));
    }
  };

  const submitModal = async () => {
    try {
      await submitFeedback({
        page: metadata.slug,
        type: feedbackType,
        options: feedbackOptions,
        comment: textData.trim(),
      });
      setFeedbackType(null);
      setFeedbackOptions([]);
      setTextData('');
      setThankYouModalOpen(true);
    } catch (error) {
      setFeedbackType(null);
      setOopsModalOpen(true);
      console.error('Error submitting feedback:', error?.toString?.() || error);
    }
  };

  const options = useMemo(() => {
    if (feedbackType === FeedbackType.LIKE) return LikeOptions;
    if (feedbackType === FeedbackType.DISLIKE) return DislikeOptions;
    return {};
  }, [feedbackType]);

  return (
    <div className="container">
      <div className="row">
        <div className="col">
          <div className="col-demo">
            <h4>Was this page helpful?</h4>
            <IconButton
              aria-label="yes"
              onClick={() => setFeedbackType(FeedbackType.LIKE)}
            >
              <ThumbUpIcon color="success" />
            </IconButton>
            <IconButton
              aria-label="no"
              onClick={() => setFeedbackType(FeedbackType.DISLIKE)}
            >
              <ThumbDownIcon color="error" />
            </IconButton>
          </div>
        </div>
      </div>
      <Modal
        open={!!feedbackType}
        onClose={() => setFeedbackType(null)}
        aria-labelledby="modal-title"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isSmallScreen ? '90%' : 'auto',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            sx={{
              color: 'text.primary',
              fontWeight: 700,
              marginBottom: '0.5em',
              textAlign: 'center',
            }}
          >
            {feedbackType === FeedbackType.LIKE
              ? `What did you like?`
              : `What went wrong?`}
          </Typography>
          <FormControl
            component="fieldset"
            variant="standard"
            sx={{ width: '100%' }}
          >
            <FormGroup>
              {Object.entries(options).map(([value, label]) => (
                <FormControlLabel
                  key={value}
                  control={
                    <Checkbox
                      checked={feedbackOptions.includes(value)}
                      onChange={(e) =>
                        handleFeedbackChange(value, e.target.checked)
                      }
                      theme={theme}
                      color="primary"
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '14px', color: 'text.primary' }}>
                      {label}
                    </Typography>
                  }
                  sx={{ alignItems: 'center' }}
                />
              ))}
              {feedbackOptions.find((o) => o.endsWith('ANOTHER_REASON')) && (
                <TextField
                  sx={{ fontSize: '12px', marginTop: '1em' }}
                  fullWidth
                  id="standard-multiline-static"
                  size="small"
                  multiline
                  rows={5}
                  variant="filled"
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                  placeholder="Please provide details"
                />
              )}
            </FormGroup>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '2em',
              }}
            >
              <Button
                theme={theme}
                color="primary"
                size="small"
                variant="contained"
                onClick={submitModal}
                sx={{ borderRadius: '12px' }}
              >
                Submit
              </Button>
            </Box>
          </FormControl>
        </Box>
      </Modal>
      <ThankYouModal
        open={thankYouModalOpen}
        onClose={() => setThankYouModalOpen(false)}
      />
      <OopsModal open={oopsModalOpen} onClose={() => setOopsModalOpen(false)} />
    </div>
  );
};

export default Feedback;
