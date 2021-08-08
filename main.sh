#! /bin/bash
#Options 
#	A update all regardless of checkbox status
#	R only remove pages
#	C Only create blocks
#	O to list options 

if [ "$#" -eq 0 ] 
then
   echo "Running update on selected database entries"
elif [ "$#" -gt 2 ]
then
   echo "Maximum 2 arguments allowed" 
   echo "Usage $0 [Options]"
   exit
elif [ "$1" = "O" ] || [ "$2" = "O"  ]
then
   echo "-------------------------------"
   echo "Options: $0"
   echo "-------------------------------"
   echo "[A] Update all entries regardless of checkbox status"
   echo "	- runs both sub programs with A setting"
   echo " "
   echo "[R] Only remove blocks"
   echo "	- this uses the program removepages.py with python3"
   echo " "
   echo "[C] Only create blocks"
   echo "	- runs the program index.cjs using node"
   echo "  "
   exit
elif [ "$1" != "A" ] && [ "$1" != "R" ] && [ "$1" != "C"  ]
then
  echo "Invalid arguments used"
  echo "To see options try $0 O"
  exit
fi

# CHECK INSTALLATIONS AND .env
#python3 --version
#node -v
#npm 
#ENV
#Unoffical 
if [ "$2" = "A" ] || [ "$1" = "A" ]
then 
  echo Updating all pages
  if [ $# -eq 1 ] || [ "$1" = "R" ] || [ "$2" = "R" ]
  then 
     echo Removing page blocks
     python3 removepages.py A
     echo All page blocks removed
  fi
  if [ $# -eq 1 ] || [ "$1" = "C" ] || [ "$2" = "C" ]
  then  
     echo Inserting new page blocks
     node index.cjs A
     echo All page blocks updated
  fi
else
  echo Updating selected
  if [ $# -eq 0 ] || [ "$1" = "R" ] || [ "$2" = "R" ]
  then
     echo Removing page blocks
     python3 removepages.py
     echo Selected page blocks removed
  fi
  if [ $# -eq 0 ] || [ "$1" = "C" ] || [ "$2" = "C" ]
  then
     echo Inserting new page blocks
     node index.cjs
     echo Selected page blocks updated
  fi
fi
