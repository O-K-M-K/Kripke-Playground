import Test.QuickCheck
import Kripke.Types
import Kripke.Checker
import qualified Data.Set as Set
import qualified Data.Map as Map
import Data.List as List
import Control.Monad (filterM, replicateM)

modelSize = 5


-- Reflexive (T)
addReflexive :: Worlds -> Relation -> Relation 
addReflexive ws rel = foldr (\w -> Map.insertWith Set.union w (Set.singleton w)) rel (Set.toList ws)


tempRelation = Map.fromList
      [ ("1", Set.fromList ["2"])
      , ("2", Set.fromList ["3"])
      , ("3", Set.empty)
      ]

-- successors of a world (empty if it has none)
succsOf :: Relation -> World -> Set.Set World
succsOf rel v = Map.findWithDefault Set.empty v rel

-- one step: for each w, add the successors of its successors  (R := R ∪ R∘R)
step :: Relation -> Relation
step rel = Map.map (\succs ->
    Set.union succs (Set.unions [ succsOf rel v | v <- Set.toList succs ])) rel

-- Transative (4)
transitiveClosure :: Relation -> Relation
transitiveClosure rel =
    let rel' = step rel
    in if rel' == rel then rel else transitiveClosure rel'


genModel :: [Char] -> Gen Model 
genModel atoms = do 
    n <- choose (1, modelSize) -- number of worlds
    let ws = map show [1 .. (n :: Int)] --worldIDs needs to be string
    rel <- mapM (\w -> do
                    succs <- sublistOf ws --random sublist of worlds for sucsessors
                    return (w, Set.fromList succs)) ws
    val <- mapM (\w -> do
                    ps <- sublistOf atoms -- this sublist needs to be restricted to props in atoms we are testing but its only really 2 for K and 1 for the rest
                    return (w, Set.fromList ps)) ws
    return Model
      { worlds    = Set.fromList ws
      , relation  = Map.fromList rel
      , valuation = Map.fromList val
      }

allValuations :: Model -> [Char] -> [Model]
allValuations m atoms = [ m { valuation = Map.fromList (zip ws v) } | v <- replicateM (length ws) subsets ]
    where
        ws      = Set.toList (worlds m)
        subsets = Set.toList (Set.powerSet (Set.fromList atoms))

-- Generating Reflexive Frames
newtype ReflexiveModel = ReflexiveModel Model deriving Show 

genReflexiveModel :: [Char] -> Gen ReflexiveModel 
genReflexiveModel atoms = do
        Model ws rel val <- genModel atoms 
        pure (ReflexiveModel (Model ws (addReflexive ws rel) val))


tAxiom :: Formula
tAxiom = implies (Box (P 'p')) (P 'p')

prop_tAxiom:: Property
prop_tAxiom= forAll (genReflexiveModel "p") $ \(ReflexiveModel m) -> all (\mdl -> worlds mdl == validInModel mdl tAxiom) (allValuations m "p")


newtype TransativeModel = TransativeModel Model deriving Show 
newtype S4Model = S4Model Model deriving Show




-- instance Arbitrary S4Model where 
--     arbitrary = do 
--         Model ws rel val <- genModel "p"
--         let rel' = transativeClosure (addReflexive ws rel)
--         pure (S4Model (Model ws rel' val))



kAxiom :: Formula
kAxiom =
  implies
    (Box (implies (P 'p') (P 'q')))
    (implies (Box (P 'p')) (Box (P 'q')))


prop_kAxiom :: Property 
prop_kAxiom = forAll (genModel "pq") $ \m -> all (\mdl -> worlds mdl == validInModel mdl kAxiom) (allValuations m "pq")


fourAxiom :: Formula 
fourAxiom = implies (Box (P 'p')) (Box (Box (P 'p')))

generic :: Model -> Bool 
generic m = worlds m == validInModel m tAxiom

main :: IO ()
main = do 
    quickCheck prop_kAxiom
    quickCheck prop_tAxiom
    -- quickCheck generic
