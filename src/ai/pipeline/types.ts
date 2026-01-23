export type TopicType = 'rule' | 'tactic' | 'skill';

export interface TopicBrief {
  topicType: TopicType;
  coreIdea: string;
  audience: 'kid_beginner';
  keywords: string[];
  misconceptions: string[];

  scope: 'single_piece' | 'multi_piece';
  relatedPieces?: Array<'queen' | 'rook' | 'bishop' | 'knight'>;
}


export interface LessonPlanLesson {
  lessonId: string;
  title: string;
  guideOutline: string[];
  exerciseLadder: Array<{
    id: string;
    goal: string;
    difficulty: 'easy' | 'medium' | 'hard';
    constraint: 'single_best_move';
  }>;
}

export interface LessonPlan {
  lessons: LessonPlanLesson[];
}

// Stage-③ output keeps the CURRENT aiJson shape so we can reuse mapAiJsonToPages().
export type AiJsonPage =
  | {
      page: number;
      type: 'guide';
      lessonId?: string;
      title?: string;
      pieces: Array<{
        type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
        color: 'white' | 'black';
        square: string; // "a1".."h8"
        symbol?: string;
      }>;
      points: string[];
    }
  | {
      page: number;
      type: 'exercise';
      lessonId?: string;
      title?: string;
      pieces: Array<{
        type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
        color: 'white' | 'black';
        square: string;
        symbol?: string;
      }>;
      // IMPORTANT: exercises MUST NOT have points (we enforce in validators).
      points?: never;
    };

export interface AiBookJson {
  lesson: string;
  lessons?: Array<{ lessonId: string; title: string }>;
  pages: AiJsonPage[];
}

export type ValidationErrorCode =
  | 'JSON_PARSE_FAILED'
  | 'MISSING_PAGES'
  | 'INVALID_PAGE_TYPE'
  | 'EXERCISE_HAS_POINTS'
  | 'GUIDE_MISSING_POINTS'
  | 'INVALID_SQUARE'
  | 'DUPLICATE_PIECE_SQUARE'
  | 'MISSING_KING'
  | 'PIECE_POINT_CONFLICT'
  | 'LESSON_SEQUENCE_ERROR';

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  pageIndex?: number;
  details?: any;
}

export interface PipelineTrace {
  topic: string;
  stages: Array<{
    name:
      | 'topic_interpreter'
      | 'lesson_planner'
      | 'content_generator'
      | 'chess_rule_validator'
      | 'pedagogy_validator'
      | 'auto_fixer'
      | 'page_generator';
    input?: any;
    output?: any;
    errors?: ValidationError[];
  }>;
}







export interface AiBookJson {

  lesson: string;

  pages: AiJsonPage[];

}



// export type ValidationErrorCode =

//   | 'JSON_PARSE_FAILED'

//   | 'MISSING_PAGES'

//   | 'INVALID_PAGE_TYPE'

//   | 'EXERCISE_HAS_POINTS'

//   | 'GUIDE_MISSING_POINTS'

//   | 'INVALID_SQUARE'

//   | 'DUPLICATE_PIECE_SQUARE'

//   | 'MISSING_KING';



export interface ValidationError {

  code: ValidationErrorCode;

  message: string;

  pageIndex?: number;

  details?: any;

}



export interface PipelineTrace {

  topic: string;

  stages: Array<{

    name:

      | 'topic_interpreter'

      | 'lesson_planner'

      | 'content_generator'

      | 'chess_rule_validator'

      | 'pedagogy_validator'

      | 'auto_fixer'

      | 'page_generator';

    input?: any;

    output?: any;

    errors?: ValidationError[];

  }>;

}








