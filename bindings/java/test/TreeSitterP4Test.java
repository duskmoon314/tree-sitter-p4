import io.github.treesitter.jtreesitter.Language;
import io.github.treesitter.jtreesitter.p4.TreeSitterP4;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class TreeSitterP4Test {
    @Test
    public void testCanLoadLanguage() {
        assertDoesNotThrow(() -> new Language(TreeSitterP4.language()));
    }
}
