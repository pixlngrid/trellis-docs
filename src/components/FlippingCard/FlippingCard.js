import React, { useState } from 'react';
import styles from './styles.module.css';

function ArrowLeftIcon({ className }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const FlippingCard = ({ data }) => {
  const [flippedCardIndex, setFlippedCardIndex] = useState(null);

  const handleCardFlip = (index) => {
    if (flippedCardIndex === index) {
      setFlippedCardIndex(null);
    } else {
      setFlippedCardIndex(index);
    }
  };

  return (
    <div className={styles.cardGallery}>
      {data.map((card, index) => (
        <div className={styles.cardGridItem} key={index}>
          <CardComponent
            byline={card.byline}
            title={card.title}
            description={card.description}
            frontContent={card.frontContent}
            checkYourKnowledge={card.checkYourKnowledge}
            isFlipped={flippedCardIndex === index}
            onFlip={() => handleCardFlip(index)}
          />
        </div>
      ))}
    </div>
  );
};

const CardComponent = ({
  byline,
  title,
  description,
  frontContent,
  checkYourKnowledge,
  isFlipped,
  onFlip,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleFlip = () => {
    onFlip();
    if (!isFlipped) {
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleFlip();
    }
  };

  const handleAnswerSelect = (event) => {
    setSelectedAnswer(Number(event.target.value));
  };

  const handleSubmit = (e) => {
    e.stopPropagation();
    setShowExplanation(true);
  };

  const getExplanations = () => {
    const correctExplanation = checkYourKnowledge.explanations.find(
      (exp) => exp.isCorrect
    );
    const selectedExplanation = checkYourKnowledge.explanations[selectedAnswer];
    return {
      correct: correctExplanation ? correctExplanation.text : '',
      selected: selectedExplanation ? selectedExplanation.text : '',
    };
  };

  return (
    <div
      className={`${styles.flipCard} ${isFlipped ? styles.flipped : ''}`}
      onClick={handleFlip}
      onKeyPress={handleKeyPress}
      role="button"
      aria-label={
        isFlipped ? 'Show front of the card' : 'Show back of the card'
      }
      aria-live="polite"
      tabIndex="0"
    >
      <div className={styles.flipCardInner}>
        <div className={styles.flipCardFront}>
          <div className={styles.cardContainer}>
            <div className={styles.cardContent}>
              <div className={styles.smallByline}>{byline}</div>
              <h3 className={styles.cardTitle}>{title}</h3>
              <div className={styles.cardDescription}>
                <p>{description}</p>
                {frontContent.map((content, index) => (
                  <p key={index}>{content}</p>
                ))}
              </div>
            </div>
            <div className={styles.ctaContainer}>
              <button className="button button--primary" onClick={handleFlip}>
                Quiz Yourself
              </button>
            </div>
          </div>
        </div>
        <div className={styles.flipCardBack}>
          <div className={styles.cardContainer}>
            <div className={styles.cardContent}>
              <div className={styles.smallBylineBack}>{title}</div>
              <div
                className={styles.quizContainer}
                onClick={(e) => e.stopPropagation()}
              >
                {showExplanation ? (
                  <div className={styles.explanation}>
                    <h3 className={styles.explanationResult}>
                      {selectedAnswer === checkYourKnowledge.correctAnswer
                        ? 'Correct!'
                        : 'Incorrect.'}
                    </h3>
                    <div className={styles.explanationText}>
                      {selectedAnswer !== checkYourKnowledge.correctAnswer && (
                        <p className={styles.incorrectExplanation}>
                          {getExplanations().selected}
                        </p>
                      )}
                      <p className={styles.correctExplanation}>
                        {getExplanations().correct}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <h5 className={styles.quizQuestion}>
                      {checkYourKnowledge.question}
                    </h5>
                    <div className={styles.quizForm}>
                      {checkYourKnowledge.options.map((option, index) => (
                        <label key={index} className={styles.quizOption}>
                          <input
                            type="radio"
                            name="quizOptions"
                            value={index}
                            checked={selectedAnswer === index}
                            onChange={handleAnswerSelect}
                            className={styles.quizRadio}
                          />
                          <span className={styles.quizLabel}>{option}</span>
                        </label>
                      ))}
                    </div>
                    <button
                      className={styles.checkAnswerButton}
                      onClick={handleSubmit}
                      disabled={selectedAnswer === null}
                    >
                      Check Your Answer
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.ctaContainer}>
              <ArrowLeftIcon className={styles.ctaArrow} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlippingCard;
