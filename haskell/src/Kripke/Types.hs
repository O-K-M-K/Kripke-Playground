module Kripke.Types
  ( Props
  , World
  , Worlds
  , Relation
  , Valuation
  , Formula(..)
  , Model(..)
  , or_
  , diamond
  , implies
  ) where

import qualified Data.Set as Set
import qualified Data.Map as Map

type Props = Char
type World = String
type Worlds = Set.Set World
type Relation = Map.Map World (Set.Set World)
type Valuation = Map.Map World (Set.Set Props)

-- Minimal Grammar
data Formula = P Props | Not Formula | And Formula Formula | Box Formula | Top | Bot deriving (Eq, Show)

data Model = Model { worlds :: Worlds, relation :: Relation, valuation :: Valuation } deriving (Eq, Show)

or_ :: Formula -> Formula -> Formula
or_ a b = Not (And (Not a) (Not b))

diamond :: Formula -> Formula
diamond f = Not (Box (Not f))

implies :: Formula -> Formula -> Formula
implies a b = Not (And a (Not b))
