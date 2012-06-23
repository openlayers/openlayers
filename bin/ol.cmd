@echo off

:: Check for ant on the path
call ant -version >NUL 2>NUL || (
  echo Requires Apache Ant ^(see http://ant.apache.org/^)
  exit /b 1
)

:: Find the full path of OL_HOME 
pushd "%~dp0.."
set OL_HOME="%cd%"
popd

:: Run the command
set COMMAND="%~1"
if "%~1" == "" set COMMAND="usage"

set ANT_ARGS=
if "%~2" == "" set ANT_ARGS="-Dbuild.json=%~2"

ant -e -f %OL_HOME%\bin\build.xml -Dol.home=%OL_HOME% -Dbasedir=. %COMMAND% %ANT_ARGS%
