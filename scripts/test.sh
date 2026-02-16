#!/bin/bash
set -e

# FitStudio Test Runner Script
# Usage: ./scripts/test.sh [options]
#
# Options:
#   --coverage    Run tests with coverage report
#   --watch       Run tests in watch mode
#   --local       Run tests locally (requires local DB)
#   --clean       Clean up test containers after running

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default options
COVERAGE=false
WATCH=false
LOCAL=false
CLEAN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --local)
      LOCAL=true
      shift
      ;;
    --clean)
      CLEAN=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

cd "$PROJECT_ROOT"

if [ "$LOCAL" = true ]; then
  echo -e "${YELLOW}Running tests locally...${NC}"
  cd server

  if [ "$COVERAGE" = true ]; then
    npm test -- --run --coverage
  elif [ "$WATCH" = true ]; then
    npm test
  else
    npm test -- --run
  fi

  exit $?
fi

echo -e "${GREEN}🐳 Starting test environment...${NC}"

# Build and run tests in Docker
if [ "$COVERAGE" = true ]; then
  echo -e "${YELLOW}Running tests with coverage...${NC}"
  docker-compose -f docker-compose.test.yml --profile coverage up --build --abort-on-container-exit test-coverage
elif [ "$WATCH" = true ]; then
  echo -e "${YELLOW}Running tests in watch mode...${NC}"
  docker-compose -f docker-compose.test.yml --profile watch up --build test-watch
else
  echo -e "${YELLOW}Running tests...${NC}"
  docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit test-runner
fi

EXIT_CODE=$?

if [ "$CLEAN" = true ]; then
  echo -e "${YELLOW}Cleaning up test containers...${NC}"
  docker-compose -f docker-compose.test.yml down -v --remove-orphans
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Tests passed!${NC}"
else
  echo -e "${RED}❌ Tests failed!${NC}"
fi

exit $EXIT_CODE
