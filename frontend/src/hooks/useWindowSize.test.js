import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useWindowSize } from './useWindowSize';

describe('Hook useWindowSize', () => {
  
  it('deve retornar as dimensões iniciais da janela ao montar', () => {
    // Definimos um tamanho inicial fixo para o ambiente de teste
    window.innerWidth = 1024;
    window.innerHeight = 768;

    const { result } = renderHook(() => useWindowSize());

    expect(result.current.width).toBe(1024);
    expect(result.current.height).toBe(768);
  });

  it('deve atualizar as dimensões quando o evento de resize ocorrer', () => {
    const { result } = renderHook(() => useWindowSize());

    // Verificação inicial
    expect(result.current.width).toBe(1024);

    // Ação: Simular o redimensionamento da janela
    act(() => {
      // 1. Altera os valores globais do window
      window.innerWidth = 500;
      window.innerHeight = 800;
      
      // 2. Dispara o evento que o hook está "ouvindo"
      window.dispatchEvent(new Event('resize'));
    });

    // Verificação pós-evento
    expect(result.current.width).toBe(500);
    expect(result.current.height).toBe(800);
  });
});